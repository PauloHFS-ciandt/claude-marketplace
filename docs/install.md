# einstein-workflow — Automated Setup Guide (via claude-marketplace)

You are configuring the einstein-workflow plugin for the current project. Follow each step in order. Do NOT skip steps. Do NOT improvise commands — run EXACTLY what is shown below. Ask the user for input when indicated.

**CRITICAL: Execute ALL steps (0 through 5) in a single session without stopping.** Do NOT pause after any step to ask the user what to do next. Do NOT present "next steps" — just continue to the next step automatically. The user expects to paste one prompt and have everything configured end-to-end.

## Step 0: Check Prerequisites

Before starting, verify that the required tools are installed. Run these checks and report any missing tools to the user **before** proceeding:

```bash
# Required
claude --version 2>/dev/null || echo "MISSING: Claude Code CLI"
node --version 2>/dev/null || echo "MISSING: Node.js"
($MAESTRI_CLI list 2>/dev/null || maestri list 2>/dev/null) || echo "MISSING: Maestri (or terminal not on canvas)"

# Recommended (not blocking)
which rtk 2>/dev/null && rtk --version 2>/dev/null || echo "OPTIONAL: RTK not installed — saves 60-90% tokens. Install: https://github.com/rtk-ai/rtk"
claude plugin list 2>&1 | grep -q claude-mem || echo "OPTIONAL: claude-mem not installed — persistent memory. Install: claude plugin install claude-mem"
```

| Tool | Required? | Purpose | Install |
|------|-----------|---------|---------|
| **Claude Code CLI** | Yes | Runtime | Already running if you see this |
| **Node.js >= 18** | Yes | Hooks and worker scripts | https://nodejs.org |
| **Maestri** | Yes | Multi-terminal orchestration | https://www.themaestri.app |
| **RTK** | Recommended | Token compression (60-90% savings) | https://github.com/rtk-ai/rtk |
| **claude-mem** | Recommended | Persistent memory across sessions | `claude plugin install claude-mem` |

**If any REQUIRED tool is missing**, tell the user what to install and STOP. Do NOT continue without all required tools.

**If only RECOMMENDED tools are missing**, note them in the output and continue — the wizard will detect and configure them later (Step 2, Step 9 of setup-project).

## Step 1: Add Marketplace and Install Plugin

**IMPORTANT: Do NOT run `claude plugin install PauloHFS-ciandt@einstein-workflow` directly without first adding the marketplace — that will fail.** This plugin is distributed via a self-hosted marketplace. You MUST add the marketplace first.

Run these two commands in order:

```bash
claude plugin marketplace add PauloHFS-ciandt/claude-marketplace
```

Wait for it to complete, then:

```bash
claude plugin install PauloHFS-ciandt@einstein-workflow
```

If the marketplace is already added, the first command is a no-op. Same for the plugin if already installed.

**Updating an existing installation:**

```bash
claude plugin marketplace update PauloHFS-ciandt/claude-marketplace
claude plugin update PauloHFS-ciandt@einstein-workflow
```

Then re-run Step 2 in each project to update the agents and rules copied to `.claude/`.

## Step 2: Run Project Setup

This generates the project's CLAUDE.md, copies agents, rules, and configures settings.

**First, try running the skill directly:**

```
/einstein-workflow:setup-project
```

**If the skill returns "Unknown skill"** (this happens when the plugin was just installed in the same session), locate the plugin cache and execute the wizard directly:

```bash
PLUGIN_ROOT=$(ls -d ~/.claude/plugins/cache/einstein-workflow/einstein-workflow/*/  2>/dev/null | head -1)
echo "Plugin root: $PLUGIN_ROOT"
```

Then read `${PLUGIN_ROOT}skills/setup-project/SKILL.md` with the Read tool and follow its instructions step by step. Use `$PLUGIN_ROOT` wherever the SKILL.md references `${CLAUDE_PLUGIN_ROOT}`.

**After setup-project completes, immediately continue to Step 3. Do NOT stop here. Do NOT present "next steps" to the user. Do NOT suggest running /setup-maestri as a next step — YOU will run it in Step 3.**

## Step 3: Set Up Maestri Workspace

**First, try running the skill directly:**

```
/einstein-workflow:setup-maestri
```

**If the skill returns "Unknown skill"**, use the same `$PLUGIN_ROOT` from Step 2. Read `${PLUGIN_ROOT}skills/setup-maestri/SKILL.md` with the Read tool and follow its instructions step by step.

## Step 4: Verify

Run `$MAESTRI_CLI list` (or `maestri list`) and confirm the terminals and portals appear. You should see entries like:
- Tech Lead
- Backend
- Frontend
- AppSec
- Frontend Preview (portal, if Frontend was created)

If any are missing, report the issue to the user.

## Step 5: Report

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

**Note:** RTK, claude-mem, and Maestri detection/configuration is handled automatically by the setup-project wizard (Step 9 of the SKILL.md). No manual setup needed here.
