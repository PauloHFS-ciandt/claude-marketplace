import { basename } from "node:path";

async function main() {
  const stdin = await new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
  });

  let payload = {};
  try { payload = JSON.parse(stdin || "{}"); } catch {}

  const title = payload.title || "Needs attention";
  const dir = basename(payload.cwd || "");
  const msg = dir ? `${dir}: ${title}` : title;

  process.stderr.write(`\x1b]9;${msg}\x07`);

  process.stdout.write("{}");
}

main().catch(() => { process.stdout.write("{}"); });
