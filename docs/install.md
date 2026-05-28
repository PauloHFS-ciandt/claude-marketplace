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

## Step 3: Verify Maestri Connection

Check that this terminal is on the Maestri canvas. The CLI may be available as `$MAESTRI_CLI` (env var set by Maestri) or `maestri` (in PATH). Try both:

```bash
$MAESTRI_CLI list 2>/dev/null || maestri list 2>/dev/null
```

If BOTH fail, tell the user:
> Open the Maestri app and make sure this terminal is on a Maestri canvas. Then say "continue" and I'll proceed.

Wait for the user to confirm before continuing.

## Step 4: Set Up Maestri Workspace

**First, try running the skill directly:**

```
/einstein-workflow:setup-maestri
```

**If the skill returns "Unknown skill"**, use the same `$PLUGIN_ROOT` from Step 2. Read `${PLUGIN_ROOT}skills/setup-maestri/SKILL.md` with the Read tool and follow its instructions step by step.

## Step 5: Verify

Run `$MAESTRI_CLI list` (or `maestri list`) and confirm the terminals and portals appear. You should see entries like:
- Tech Lead
- Backend
- Frontend
- AppSec
- Frontend Preview (portal, if Frontend was created)

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

**Note:** RTK, claude-mem, and Maestri detection/configuration is handled automatically by the setup-project wizard (Step 10 of the SKILL.md). No manual setup needed here.
