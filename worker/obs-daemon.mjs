#!/usr/bin/env node
/**
 * obs-daemon.mjs — Background daemon that drains claude-mem's pending_messages
 * via curl to the CI&T Flow LLM proxy.
 *
 * The standard claude-mem worker uses the Claude Agent SDK which doesn't work
 * with CI&T's corporate proxy. This daemon bypasses the SDK entirely and calls
 * the proxy directly via curl.
 *
 * Configuration (environment variables or .env file):
 *   FLOW_PROXY_URL    — CI&T proxy URL (default: https://flow.ciandt.com/flow-llm-proxy/v1/messages)
 *   FLOW_PROXY_KEY    — API key for the proxy (also reads _FLOW_PROXY_API_KEY from ~/.zshrc)
 *   FLOW_PROXY_MODEL  — Model to use (default: anthropic.claude-4-6-sonnet)
 *
 * Lifecycle:
 *   - Started by SessionStart hook (detached, won't block)
 *   - Polls pending_messages every 30s
 *   - Processes 5 batches per cycle (75 messages max)
 *   - Self-terminates after 30min idle (no pending messages)
 *   - PID file prevents duplicate instances
 *
 * Usage:
 *   node obs-daemon.mjs start    # start daemon (from hook)
 *   node obs-daemon.mjs run      # run in foreground (debug)
 *   node obs-daemon.mjs stop     # stop daemon
 *   node obs-daemon.mjs status   # check if running
 *   node obs-daemon.mjs drain    # one-shot: process all pending
 */

import { readFileSync, existsSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { execFileSync, spawn } from "node:child_process";
import crypto from "node:crypto";

const HOME = homedir();
const DB = join(HOME, ".claude-mem/claude-mem.db");
const PID_FILE = join(HOME, ".claude/hooks/.obs-daemon.pid");
const LOG_DIR = join(HOME, ".claude-mem/logs");
const LOG_FILE = join(LOG_DIR, "obs-daemon.log");

const DEFAULT_URL = "https://flow.ciandt.com/flow-llm-proxy/v1/messages";
const DEFAULT_MODEL = "anthropic.claude-4-6-sonnet";
const BATCH_SIZE = 15;
const BATCHES_PER_CYCLE = 5;
const POLL_INTERVAL = 30_000;
const IDLE_TIMEOUT = 30 * 60_000;

const CMD = process.argv[2] || "start";

// ── Configuration ──

function loadConfig() {
  const config = {
    url: process.env.FLOW_PROXY_URL || DEFAULT_URL,
    model: process.env.FLOW_PROXY_MODEL || DEFAULT_MODEL,
    key: process.env.FLOW_PROXY_KEY || null,
  };

  // Try loading key from environment variable in .zshrc
  if (!config.key) {
    try {
      const zshrc = readFileSync(join(HOME, ".zshrc"), "utf8");
      const m = zshrc.match(/^(?:export |readonly )?_FLOW_PROXY_API_KEY="([^"]+)"/m);
      if (m) config.key = m[1];
    } catch {}
  }

  // Try loading from .claude-mem/.env
  if (!config.key) {
    try {
      for (const line of readFileSync(join(HOME, ".claude-mem/.env"), "utf8").split("\n")) {
        if (line.startsWith("FLOW_PROXY_KEY=")) config.key = line.slice(15).trim();
        if (line.startsWith("ANTHROPIC_API_KEY=")) config.key = line.slice(17).trim();
      }
    } catch {}
  }

  return config;
}

// ── Logging ──

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  if (CMD === "run" || CMD === "drain") process.stdout.write(line);
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(LOG_FILE, line, { flag: "a" });
  } catch {}
}

// ── PID management ──

function readPid() {
  try { return parseInt(readFileSync(PID_FILE, "utf8").trim()); } catch { return null; }
}

function isRunning(pid) {
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function writePid() {
  mkdirSync(dirname(PID_FILE), { recursive: true });
  writeFileSync(PID_FILE, String(process.pid));
}

function clearPid() { try { unlinkSync(PID_FILE); } catch {} }

// ── DB helpers ──

function sql(query) {
  try {
    return execFileSync("sqlite3", [DB, query], { encoding: "utf8", timeout: 10000 }).trim();
  } catch { return ""; }
}

function sqlJson(query) {
  try {
    return JSON.parse(
      execFileSync("sqlite3", ["-json", DB, query], { encoding: "utf8", timeout: 10000 }).trim() || "[]"
    );
  } catch { return []; }
}

const esc = (s) => String(s || "").replace(/'/g, "''");

// ── API call via curl (bypasses broken SDK) ──

function callProxy(config, prompt, maxTokens = 800) {
  const MAX_RETRIES = 2;
  let lastErr;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ts = `${Date.now()}-${(Math.random() * 1e6 | 0)}`;
    const bodyFile = `/tmp/obsd-body-${ts}.json`;
    try {
      writeFileSync(bodyFile, JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }));

      const raw = execFileSync("curl", [
        "-s", "--retry", "1", "--max-time", "45", config.url,
        "-H", "Content-Type: application/json",
        "-H", `x-api-key: ${config.key}`,
        "-H", `Authorization: Bearer ${config.key}`,
        "-H", "anthropic-version: 2023-06-01",
        "-d", `@${bodyFile}`,
      ], { encoding: "utf8", timeout: 55000 });

      unlinkSync(bodyFile);

      if (!raw.trim()) throw new Error("Empty response from API");
      const r = JSON.parse(raw);
      if (r.error) {
        if (r.error.type === "overloaded_error" && attempt < MAX_RETRIES) {
          lastErr = new Error(r.error.message);
          continue;
        }
        throw new Error(r.error.message);
      }
      return r.content?.[0]?.text || "";
    } catch (e) {
      try { unlinkSync(bodyFile); } catch {}
      lastErr = e;
      if (attempt < MAX_RETRIES) continue;
    }
  }
  throw lastErr;
}

// ── JSON extraction (resilient to LLM markdown wrapping) ──

function extractJson(raw) {
  let s = raw.trim();
  if (s.startsWith("```")) s = s.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  s = s.trim();
  try { return JSON.parse(s); } catch {}
  const m = s.match(/\{[\s\S]*"type"\s*:\s*"[^"]+[\s\S]*"title"\s*:\s*"[^"]+[\s\S]*\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  const brace = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (brace >= 0 && last > brace) try { return JSON.parse(s.slice(brace, last + 1)); } catch {}
  throw new Error(`Not JSON: ${s.slice(0, 40)}...`);
}

// ── Observation processing ──

function buildPrompt(batch, project) {
  const lines = batch.map((m) => {
    let i, o;
    try { i = JSON.parse(m.tool_input || "{}"); } catch { i = m.tool_input; }
    try { o = JSON.parse(m.tool_response || "{}"); } catch { o = m.tool_response; }
    const is = typeof i === "object"
      ? (i.file_path || i.command || i.query || JSON.stringify(i).slice(0, 200))
      : String(i).slice(0, 200);
    const os = typeof o === "object"
      ? String(o.stdout || o.output || JSON.stringify(o)).slice(0, 300)
      : String(o).slice(0, 300);
    return `[${m.tool_name}] ${is}\n→ ${os}`;
  }).join("\n\n");

  return `You are a code observation engine for project "${project}". Generate ONE observation.

TOOL USAGE:
${lines}

Raw JSON only:
{"type":"change","title":"max 80 chars","narrative":"2-4 sentences","concepts":["what-changed"],"files":["files"]}
Types: discovery|change|bugfix|feature|refactor|decision`;
}

function saveObs(obs, sid, proj) {
  const now = Date.now();
  const hash = crypto.createHash("md5").update(obs.narrative || obs.title || String(now)).digest("hex").slice(0, 16);
  sql(`INSERT OR IGNORE INTO observations (memory_session_id,project,type,title,narrative,concepts,files_read,files_modified,facts,created_at,created_at_epoch,content_hash,generated_by_model,discovery_tokens,relevance_count) VALUES ('${esc(sid)}','${esc(proj)}','${esc(obs.type || "change")}','${esc(obs.title)}','${esc(obs.narrative)}','${esc(JSON.stringify(obs.concepts || []))}','${esc(JSON.stringify(obs.files || []))}','[]','[]','${new Date().toISOString()}',${now},'${hash}','obs-daemon',0,0);`);
}

function deletePending(ids) {
  sql(`DELETE FROM pending_messages WHERE id IN (${ids.join(",")});`);
}

// ── One processing cycle ──

function cycle(config, maxBatches) {
  const pending = parseInt(sql("SELECT COUNT(*) FROM pending_messages;") || "0");
  if (pending === 0) return 0;

  const sessions = sqlJson(`
    SELECT pm.session_db_id, s.content_session_id, s.memory_session_id, s.project, COUNT(*) as n
    FROM pending_messages pm JOIN sdk_sessions s ON s.id = pm.session_db_id
    GROUP BY pm.session_db_id ORDER BY n DESC LIMIT 5
  `);

  let batches = 0, created = 0;

  for (const sess of sessions) {
    if (batches >= maxBatches) break;

    let mid = sess.memory_session_id;
    if (!mid) {
      mid = `adhoc-${sess.content_session_id}`;
      sql(`UPDATE sdk_sessions SET memory_session_id='${mid}' WHERE id=${sess.session_db_id} AND memory_session_id IS NULL;`);
    }
    const proj = sess.project || "unknown";

    const msgs = sqlJson(`
      SELECT id, tool_name, tool_input, tool_response
      FROM pending_messages WHERE session_db_id = ${sess.session_db_id}
      ORDER BY id LIMIT ${BATCH_SIZE * maxBatches}
    `);

    for (let i = 0; i < msgs.length && batches < maxBatches; i += BATCH_SIZE) {
      const chunk = msgs.slice(i, i + BATCH_SIZE);
      const ids = chunk.map((m) => m.id);
      batches++;

      try {
        const resp = callProxy(config, buildPrompt(chunk, proj));
        const obs = extractJson(resp);
        saveObs(obs, mid, proj);
        created++;
        log(`✅ [${batches}] ${obs.type}: ${(obs.title || "").slice(0, 55)}`);
      } catch (e) {
        log(`❌ [${batches}] ${String(e.message || e).slice(0, 80)}`);
      }
      deletePending(ids);
    }
  }

  return created;
}

// ── Commands ──

if (CMD === "status") {
  const pid = readPid();
  if (pid && isRunning(pid)) {
    console.log(`Running (PID ${pid})`);
  } else {
    console.log("Not running");
    if (pid) clearPid();
  }
  process.exit(0);
}

if (CMD === "stop") {
  const pid = readPid();
  if (pid && isRunning(pid)) {
    process.kill(pid, "SIGTERM");
    clearPid();
    console.log(`Stopped (PID ${pid})`);
  } else {
    console.log("Not running");
    if (pid) clearPid();
  }
  process.exit(0);
}

if (CMD === "drain") {
  const config = loadConfig();
  if (!config.key) { console.error("No API key found. Set FLOW_PROXY_KEY or _FLOW_PROXY_API_KEY in ~/.zshrc"); process.exit(1); }
  if (!existsSync(DB)) { console.error("claude-mem DB not found. Install and run claude-mem first."); process.exit(1); }

  const before = parseInt(sql("SELECT COUNT(*) FROM observations;") || "0");
  let total = 0;
  for (let i = 0; i < 20; i++) {
    const n = cycle(config, 10);
    total += n;
    const left = parseInt(sql("SELECT COUNT(*) FROM pending_messages;") || "0");
    if (left === 0) break;
  }
  const after = parseInt(sql("SELECT COUNT(*) FROM observations;") || "0");
  console.log(`Drained: ${after - before} new observations (${after} total), ${sql("SELECT COUNT(*) FROM pending_messages;")} remaining`);
  process.exit(0);
}

if (CMD === "start") {
  const existing = readPid();
  if (existing && isRunning(existing)) {
    process.stdout.write('{"continue":true,"suppressOutput":true}');
    process.exit(0);
  }

  const child = spawn("node", [process.argv[1], "run"], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });
  child.unref();

  process.stdout.write('{"continue":true,"suppressOutput":true}');
  process.exit(0);
}

if (CMD === "run") {
  const config = loadConfig();
  if (!config.key) { log("No API key found. Set FLOW_PROXY_KEY or _FLOW_PROXY_API_KEY in ~/.zshrc"); process.exit(1); }
  if (!existsSync(DB)) { log("claude-mem DB not found. Install and run claude-mem first."); process.exit(1); }

  writePid();
  log(`Daemon started (PID ${process.pid}) — proxy: ${config.url} — model: ${config.model}`);

  process.on("SIGTERM", () => { log("SIGTERM received, exiting"); clearPid(); process.exit(0); });
  process.on("SIGINT", () => { log("SIGINT received, exiting"); clearPid(); process.exit(0); });

  let idleSince = null;

  async function loop() {
    while (true) {
      try {
        const created = cycle(config, BATCHES_PER_CYCLE);
        const pending = parseInt(sql("SELECT COUNT(*) FROM pending_messages;") || "0");

        if (pending > 0) {
          idleSince = null;
        } else if (!idleSince) {
          idleSince = Date.now();
        } else if (Date.now() - idleSince > IDLE_TIMEOUT) {
          log("Idle timeout (30min), shutting down");
          clearPid();
          process.exit(0);
        }

        if (created > 0) {
          log(`Cycle done: +${created} obs, ${pending} pending`);
        }
      } catch (e) {
        log(`Cycle error: ${e.message}`);
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
    }
  }

  loop();
}
