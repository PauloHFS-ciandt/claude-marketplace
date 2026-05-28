# einstein-workflow — Automated Setup Guide

You are configuring the einstein-workflow plugin for the current project. Follow each step in order. Do NOT skip steps. Do NOT improvise commands — run EXACTLY what is shown below. Ask the user for input when indicated.

## Step 1: Add Marketplace and Install Plugin

**IMPORTANT: Do NOT run `claude plugin install PauloHFS-ciandt/einstein-workflow` — that will fail.** This plugin is distributed as a self-hosted marketplace, not via the default registry. You MUST add the marketplace first.

Run these two commands in order:

```bash
claude plugin marketplace add PauloHFS-ciandt/einstein-workflow
```

Wait for it to complete, then:

```bash
claude plugin install einstein-workflow@einstein-workflow
```

If the marketplace is already added, the first command is a no-op. Same for the plugin if already installed.

**Updating an existing installation:**

```bash
claude plugin marketplace update einstein-workflow
claude plugin update einstein-workflow@einstein-workflow
```

Then re-run `/einstein-workflow:setup-project` in each project to update the agents and rules copied to `.claude/` (the wizard detects conflicts and backs up existing files before overwriting).

**After installing or updating:** skills may not be available until the Claude Code session is restarted. If `/einstein-workflow:setup-project` returns "Unknown skill", tell the user:

> The plugin was installed but skills aren't loaded yet. Please restart Claude Code (`exit` then `claude`) and paste this prompt again:
> 
> Install and configure einstein-workflow by following the instructions here:
> https://raw.githubusercontent.com/PauloHFS-ciandt/einstein-workflow/main/docs/install.md

Then STOP — do not continue. The fresh session will pick up from Step 2.

Move on to Step 2.

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

Check that this terminal is on the Maestri canvas. The CLI may be available as `$MAESTRI_CLI` (env var set by Maestri) or `maestri` (in PATH). Try both:

```bash
$MAESTRI_CLI list 2>/dev/null || maestri list 2>/dev/null
```

If BOTH fail, tell the user:
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

Run `$MAESTRI_CLI list` (or `maestri list`) and confirm the terminals appear. You should see entries like:
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
> **This terminal was only used for installation.** You can close it now.
> From now on, talk directly to the **Tech Lead** terminal on the canvas.
>
> **How to use:**
> - Talk to **Tech Lead** — it orchestrates all work and delegates to specialists
> - Tech Lead uses `maestri ask "Backend" "..."` to delegate implementation
> - **AppSec** review is mandatory before creating PRs
>
> **Try it** (from the Tech Lead terminal):
> ```
> maestri ask "Tech Lead" "what can you help me with?"
> ```

**Note:** RTK, claude-mem, and Maestri detection/configuration is handled automatically by `/einstein-workflow:setup-project` (Step 10). No manual setup needed here.
