import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const STATE_PATH = join(homedir(), ".claude/hooks/state/claude-hooks-state.json");

function parseJson(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return {};
  }
}

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return { version: 1, sessions: {} };
  }
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { version: 1, sessions: {} };
  }
}

function saveState(state) {
  const dir = dirname(STATE_PATH);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function readStdin() {
  return await new Promise((resolveInput) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolveInput(data));
  });
}

async function main() {
  const payload = parseJson(await readStdin());
  const sessionId = payload.session_id || payload.conversation_id || "global";
  const state = loadState();
  const session = state.sessions[sessionId] || state.sessions.global;

  if (!session) {
    process.stdout.write("{}");
    return;
  }

  const needsDocsReminder = session.codeEdits > 0 && session.docEdits === 0;
  const touchedTs = (session.touched || []).some((f) => /\.tsx?$/.test(f));

  delete state.sessions[sessionId];
  state.updatedAt = Date.now();
  saveState(state);

  const messages = [];

  if (touchedTs) {
    try {
      const cwd = payload.cwd || process.cwd();
      const shimPath = join(homedir(), ".local/share/mise/shims");
      const env = { ...process.env, PATH: `${shimPath}:${process.env.PATH}` };
      execFileSync("npx", ["tsc", "--noEmit"], { cwd, env, timeout: 30000, encoding: "utf8" });
    } catch (err) {
      const output = (err.stdout || err.message || "").trim().split("\n").slice(0, 30).join("\n");
      if (output) {
        messages.push(`TypeScript errors found:\n${output}`);
      }
    }
  }

  if (needsDocsReminder) {
    messages.push("Documentation guard: code was edited but no docs were updated in this session. Consider updating relevant documentation.");
  }

  if (messages.length > 0) {
    process.stdout.write(JSON.stringify({ followup_message: messages.join("\n\n") }));
    return;
  }

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
