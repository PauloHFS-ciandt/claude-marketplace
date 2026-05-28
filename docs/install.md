# einstein-workflow — Automated Setup Guide

You are configuring the einstein-workflow plugin for the current project. Follow each step in order. Do NOT skip steps. Ask the user for input when indicated.

## Step 1: Install the Plugin

Run this command to install the plugin:

```bash
claude plugin install PauloHFS-ciandt/einstein-workflow
```

If the user already has it installed, this is a no-op. Move on.

## Step 2: Run Project Setup

This generates the project's CLAUDE.md, copies agents, rules, and configures settings.

Run the skill:

```
/einstein-workflow:setup-project
```

This is an interactive wizard — it will ask the user about:
- Project name and description
- Sub-projects (backend, frontend, mobile paths and stacks)
- Azure DevOps organization, project, and team (optional)
- Whether to enable the security gate

Let the wizard run to completion. It generates:
- `CLAUDE.md` at the project root
- `.claude/agents/` with 16 agents
- `.claude/rules/` with 3 rules
- `.claude/settings.json` with MCP servers and permissions
- `.claude/WORKFLOW.md` with team topology

## Step 3: Verify Maestri Connection

Check that this terminal is on the Maestri canvas:

```bash
maestri list
```

If this fails, tell the user:
> Open the Maestri app and make sure this terminal is on a Maestri canvas. Then say "continue" and I'll proceed.

Wait for the user to confirm before continuing.

## Step 4: Set Up Maestri Workspace

Run the skill to create specialist terminals on the canvas:

```
/einstein-workflow:setup-maestri
```

This creates roles, recruits terminals (Tech Lead, Backend, Frontend, Mobile, AppSec), wires connections between them, and adds a shared project note — all directly on the Maestri canvas.

Let the wizard run to completion.

## Step 5: Verify

Run `maestri list` and confirm the terminals appear. You should see entries like:
- Tech Lead
- Backend
- Frontend
- Mobile
- AppSec

If any are missing, report the issue to the user.

## Step 6: Report

Tell the user:

> Setup complete! Your Maestri workspace is ready.
>
> **How to use:**
> - Talk to **Tech Lead** — it orchestrates all work and delegates to specialists
> - Tech Lead uses `maestri ask "Backend" "..."` to delegate implementation
> - **AppSec** review is mandatory before creating PRs
>
> **Try it:**
> ```
> maestri ask "Tech Lead" "what can you help me with?"
> ```

## Optional: claude-mem Worker (CI&T proxy users)

If the team uses CI&T's Flow LLM proxy and has claude-mem installed, the plugin includes a custom observation processor that bypasses the broken SDK.

Ask the user: "Do you use CI&T's Flow proxy and claude-mem? (yes/no)"

If yes:

1. Check if `_FLOW_PROXY_API_KEY` is defined:
   ```bash
   grep '_FLOW_PROXY_API_KEY' ~/.zshrc
   ```

2. If defined, configure the obs-daemon as a SessionStart hook. Add to `~/.claude/settings.json` under `hooks.SessionStart`:
   ```json
   {
     "matcher": "startup",
     "hooks": [{
       "type": "command",
       "command": "node ~/.claude/hooks/obs-daemon.mjs start",
       "timeout": 5
     }]
   }
   ```

3. Copy the daemon script:
   ```bash
   PLUGIN_PATH=$(ls -d ~/.claude/plugins/cache/*/einstein-workflow/*/worker/obs-daemon.mjs 2>/dev/null | head -1)
   cp "$PLUGIN_PATH" ~/.claude/hooks/obs-daemon.mjs
   ```

4. Start it:
   ```bash
   node ~/.claude/hooks/obs-daemon.mjs start
   ```

If no, skip this section entirely.
