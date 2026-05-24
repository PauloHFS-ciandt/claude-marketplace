import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const STATE_PATH = join(homedir(), ".claude/hooks/state/claude-hooks-state.json");

function readJson(stdinText) {
  try {
    return JSON.parse(stdinText || "{}");
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

function pickFilePath(payload) {
  const input = payload.tool_input || payload;
  return (
    input.file_path ||
    input.path ||
    input.relative_path ||
    input.filePath ||
    input.file ||
    ""
  );
}

function isDocPath(filePath) {
  if (!filePath) {
    return false;
  }
  const normalized = String(filePath).replace(/\\/g, "/");
  return (
    normalized.startsWith("docs/") ||
    normalized.endsWith(".md") ||
    normalized.endsWith(".mdx") ||
    normalized.endsWith("/README.md")
  );
}

async function main() {
  const stdin = await new Promise((resolveInput) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolveInput(data));
  });

  const payload = readJson(stdin);
  const sessionId = payload.session_id || payload.conversation_id || "global";
  const filePath = pickFilePath(payload);

  const state = loadState();
  if (!state.sessions[sessionId]) {
    state.sessions[sessionId] = { codeEdits: 0, docEdits: 0, touched: [] };
  }

  const session = state.sessions[sessionId];
  if (isDocPath(filePath)) {
    session.docEdits += 1;
  } else {
    session.codeEdits += 1;
  }
  if (filePath && !session.touched.includes(filePath)) {
    session.touched.push(filePath);
    session.touched = session.touched.slice(-20);
  }

  state.updatedAt = Date.now();
  saveState(state);

  process.stdout.write("{}");
}

main().catch(() => {
  process.stdout.write("{}");
});
