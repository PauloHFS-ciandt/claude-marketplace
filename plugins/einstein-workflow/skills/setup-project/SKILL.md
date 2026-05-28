---
description: "Interactive wizard that configures a project for the einstein-workflow plugin. Generates CLAUDE.md, installs agents and rules into the project, configures .claude/settings.json, and creates .claude/WORKFLOW.md. Run this once when onboarding a new project. Safe to re-run — detects conflicts."
---

# /setup-project — Project Configuration Wizard

You are an interactive setup wizard for the **einstein-workflow** plugin. Your job is to collect project information through conversation and install the complete workflow into the project directory.

## What You Generate

1. **`CLAUDE.md`** at the repository root — the single source of truth for all agents
2. **`.claude/settings.json`** — project-level hooks, MCP servers, and permissions
3. **`.claude/WORKFLOW.md`** — agent topology and team structure reference
4. **`.claude/agents/*.md`** — copies of all 16 plugin agents into the project (avoids shadowing issues)
5. **`.claude/rules/*.mdc`** — copies of all 3 plugin rules into the project (rules don't load from plugins)

## Important: Why We Copy Agents and Rules

Claude Code plugin agents are **shadowed** by project-level agents with the same name. Plugin rules are **not loaded at all** — rules only work from `.claude/rules/`. Therefore, this wizard copies agents and rules directly into the project's `.claude/` directory to ensure they always work, regardless of the user's global config.

## Wizard Flow

### Step 1: Collect Project Information

Ask the user the following questions using `AskUserQuestion`. Group related questions (max 4 per call). Adapt follow-up questions based on answers.

**Round 1 — Project Identity:**
- Project name (e.g., "Portal do Paciente")
- Organization or department (e.g., "Hospital Einstein — Oncologia")
- Brief project description (1-2 sentences)

**Round 2 — Repository Structure:**
- Is this a monorepo or single project?
- If monorepo: list sub-projects with name, relative path, and stack type (backend/frontend/mobile)
- If single: what is the stack type?

**Round 3 — Tech Stack (per sub-project):**
- Package manager: yarn / npm / pnpm
- Language: TypeScript / JavaScript / mixed
- **Backend**: framework (Express/Fastify/NestJS), ORM (Sequelize/Prisma/TypeORM/none), database (PostgreSQL/MySQL/MongoDB), logging (Pino/Winston/console)
- **Frontend**: framework (React/Vue/Svelte), build tool (Vite/webpack/Next.js), UI library (MUI/Chakra/shadcn/Tailwind), form library (Formik/React Hook Form), router (React Router/Next.js/TanStack Router)
- **Mobile**: framework (React Native/Flutter), build system (Expo/bare RN), routing (Expo Router/React Navigation), state management (Zustand/Redux/Context), styling (Styled Components/StyleSheet/NativeWind)

**Round 4 — Process & Integrations:**
- Auth strategy: JWT cookies / JWT bearer / Firebase Auth / OAuth / other
- Azure DevOps: org, project, team name (or skip)
- Default PR target branch: develop / main
- Commit prefix pattern: [TICKET-XXXX] / JIRA-XXXX / conventional / none
- Security review gate required before PRs? yes / no

**Round 5 — MCP Servers (optional):**
- Do you have Jest test projects that should have MCP servers? If yes, which sub-projects?

Note: Azure DevOps MCP is already included in the plugin via `plugin.json`. The user just needs to configure `ADO_ORG`, `ADO_PROJECT`, and `ADO_TEAM` environment variables. The `/setup-project` wizard handles this if the user provided Azure DevOps config in Round 4.

To configure, add to the project's `.claude/settings.json`:
```json
{
  "env": {
    "ADO_ORG": "{org from Round 4}",
    "ADO_PROJECT": "{project from Round 4}",
    "ADO_TEAM": "{team from Round 4}"
  }
}
```

The user also needs to authenticate once via `az login` (Azure CLI) for the MCP to work.

### Step 2: Generate CLAUDE.md

Write `CLAUDE.md` at the repository root with this structure:

```markdown
# CLAUDE.md

@.claude/WORKFLOW.md

## Project Overview

**{project_name}** — {description}
Organization: {organization}

## Repository Structure

{if monorepo}
This is a monorepo with {N} sub-projects:

| Sub-project | Path | Stack |
|---|---|---|
| {name} | `{path}/` | {stack description} |
...

Each project is independent with its own package.json and development workflow.
{else}
Single project: {stack description}
{endif}

## {Sub-project Name} ({stack type})

**Location:** `{path}/`

### Tech Stack
- {framework} + {language}
- {ORM} ({database})
- {UI library} (if frontend/mobile)
- {state management} (if frontend/mobile)
- {form library}
- {auth strategy}
- {logging framework} (if backend)

### Key Commands
```bash
cd {path}
{package_manager} dev          # Start dev server
{package_manager} test         # Run tests
{package_manager} build        # Build
{package_manager} lint         # Lint
```

### Project Structure
(Tell the user: "I'll explore the actual directory to fill this in.")
Read the sub-project directory and document the key folders.

{repeat for each sub-project}

## Team

| Role | Terminal | Working Directory |
|---|---|---|
| Tech Lead | Tech Lead | `{root}/` |
| Backend Engineer | Backend | `{backend_path}/` |
| Frontend Engineer | Frontend | `{frontend_path}/` |
| Mobile Engineer | Mobile | `{mobile_path}/` |
| AppSec Engineer | AppSec | `{root}/` |

(Only include rows for sub-projects that exist)

## Azure DevOps Integration

{if azure_devops configured}
- **Organization:** {org}
- **Project:** {project}
- **Team:** {team}
- **Board:** https://dev.azure.com/{org}/{project}/_boards/board/t/{team}
- Always link PRs to work items
- PR creation: `az repos pr create --repository <REPO> --source-branch <branch> --target-branch {pr_target_branch}`
{else}
(Skip this section)
{endif}

## General Development Guidelines

### Commit Messages
- Format: `{commit_prefix} <type>(<scope>): <subject>`
- Always in English, imperative mood
- Ask for ticket number if not provided

### PR Workflow
{if security_gate}
- Mandatory security review before every PR
- Sequence: implement → test → security review → PR
{endif}
- Target branch: `{pr_target_branch}`

### Testing Strategy
- All projects use Jest (or read from actual config)
- Tests are mandatory for new features and bug fixes
- Run tests before committing

{if has_legacy_migration}
## Legacy Migration Protocol

The project has code in legacy paths that should be migrated incrementally.
When touching legacy code, migrate the affected parts to the new architecture.
Read .claude/MIGRATION.md for the specific migration checklist.
{endif}
```

### Step 3: Generate .claude/settings.json

Create `.claude/settings.json` with **NO hooks** (hooks come from the plugin automatically):

```json
{
  "permissions": {
    "allow": [
      "Bash(git add *)",
      "Bash(git fetch *)",
      "Bash({package_manager} test *)",
      "Bash({package_manager} lint *)"
    ]
  },
  "env": {
    "ADO_ORG": "{org from Round 4, if configured}",
    "ADO_PROJECT": "{project from Round 4}",
    "ADO_TEAM": "{team from Round 4}"
  },
  "mcpServers": {
    // Only if Jest MCP was requested:
    "jest-{subproject}": {
      "command": "node",
      "args": ["{jest_mcp_path}"],
      "env": {
        "PROJECT_ROOT": "{absolute_path_to_subproject}"
      }
    }
  }
}
```

**Notes on MCP servers:**
- **Azure DevOps** is already configured in the plugin's `plugin.json` — no need to add it here. Just set the `ADO_ORG`, `ADO_PROJECT`, `ADO_TEAM` env vars above.
- **Jest MCP** requires a local jest-mcp server. Ask the user for the path. If they don't have one, leave a TODO comment.
- The user needs to run `az login` once to authenticate with Azure DevOps.

### Step 4: Generate .claude/WORKFLOW.md

Create `.claude/WORKFLOW.md` with:

```markdown
# Agent Workflow — {project_name}

**Status:** Configured via einstein-workflow plugin
**Setup date:** {today}

## Agents

The following agents are available from the einstein-workflow plugin:

### Core Team
| Role | Agent | Model |
|---|---|---|
| Tech Lead | tech-lead | opus |
| Backend Engineer | backend-engineer | sonnet |
| Frontend Engineer | frontend-engineer | sonnet |
| Mobile Engineer | mobile-engineer | sonnet |

### Brainstorm Squad (used during /brainstorm)
| Role | Agent |
|---|---|
| API Contract Designer | api-contract-designer |
| Data Model Designer | data-model-designer |
| Edge Case Hunter | edge-case-hunter |
| Integration Impact Analyst | integration-impact-analyst |
| PO Analyst | po-analyst |
| UX Consistency Reviewer | ux-consistency-reviewer |

### Workflow Agents
| Role | Agent |
|---|---|
| Doc Shepherd | doc-shepherd |
| Pattern Extractor | pattern-extractor |
| Plan Sync | plan-sync |
| README Writer | readme-writer |

## Flow

```
Tech Lead (entry point)
  ├── backend-engineer
  ├── frontend-engineer
  ├── mobile-engineer
  └── appsec (security gate)
```

{if security_gate}
## Security Gate

AppSec review is **mandatory** before every PR. The Tech Lead enforces this.
{endif}

## Tools (install separately — see plugin README)

| Tool | Purpose | Install |
|---|---|---|
| **Maestri** | Multi-terminal orchestration (required) | Download from [themaestri.app](https://www.themaestri.app) |
| **RTK** | Token compression for Bash (60-90% savings) | `curl -fsSL https://raw.githubusercontent.com/cortesi/rtk/main/install.sh \| bash` |
| **claude-mem** | Persistent memory across sessions | `claude plugin install claude-mem` + `npx claude-mem start` |
| **Context7** | Library documentation lookup | Included via context7 plugin |

---
*Generated by /setup-project on {today}*
```

### Step 5: Explore and Enrich

After generating the files, **explore the actual codebase** to fill in:
- Project Structure sections in CLAUDE.md (read actual directories)
- Key Commands (read package.json scripts)
- Path aliases (read tsconfig.json or babel.config.js)
- Environment variables (read .env.tpl or .env.example)

### Step 6: Install Agents

Copy EXACTLY these 16 agent files from the plugin into `.claude/agents/`. **Do NOT use glob (`*.md`) — copy only the files listed below.** The plugin cache directory may contain extra files that should not be copied.

**The plugin root is available via `${CLAUDE_PLUGIN_ROOT}`.** Use it to find the agent source files.

**Files to copy (16 — no more, no less):**

```bash
AGENTS=(
  tech-lead.md
  backend-engineer.md
  frontend-engineer.md
  mobile-engineer.md
  security-reviewer.md
  lexicon.md
  api-contract-designer.md
  data-model-designer.md
  edge-case-hunter.md
  integration-impact-analyst.md
  po-analyst.md
  ux-consistency-reviewer.md
  doc-shepherd.md
  pattern-extractor.md
  plan-sync.md
  readme-writer.md
)

mkdir -p .claude/agents
for f in "${AGENTS[@]}"; do
  cp "${CLAUDE_PLUGIN_ROOT}/agents/$f" .claude/agents/
done
echo "Copied ${#AGENTS[@]} agent files"
```

**Conflict detection:** Before copying each file, check if it already exists. If it does and has different content, ask the user before overwriting (backup to `.bak`). If identical, skip silently.

### Step 7: Install Rules

Copy EXACTLY these 3 rule files from the plugin into `.claude/rules/`. **Do NOT use glob (`*.mdc`).**

```bash
RULES=(
  commits.mdc
  context7-documentation.mdc
  no-unsolicited-markdown.mdc
)

mkdir -p .claude/rules
for f in "${RULES[@]}"; do
  cp "${CLAUDE_PLUGIN_ROOT}/rules/$f" .claude/rules/
done
echo "Copied ${#RULES[@]} rule files"
```

Same conflict detection as agents.

### Step 8: Hooks — DO NOT ADD

**CRITICAL: Do NOT add ANY hooks to the project's `.claude/settings.json`. Not with `${CLAUDE_PLUGIN_ROOT}`, not with absolute paths, not with relative paths. ZERO hooks in the project settings.**

All hooks (track-edit, doc-guard-stop, block-env-edits, lint-on-edit) run automatically from the plugin's `plugin.json`. Adding them to the project settings will either:
- Cause `${CLAUDE_PLUGIN_ROOT}` errors (variable only resolves inside plugin hooks)
- Create absolute paths to the plugin cache that break on updates
- Cause duplicate hook execution

The `.claude/settings.json` should contain ONLY `permissions`, `env`, and `mcpServers`. No `hooks` key at all.

### Step 9: Explore and Enrich

After generating the files, **explore the actual codebase** to fill in:
- Project Structure sections in CLAUDE.md (read actual directories)
- Key Commands (read package.json scripts)
- Path aliases (read tsconfig.json or babel.config.js)
- Environment variables (read .env.tpl or .env.example)

### Step 10: Detect Optional Tools

**This step is MANDATORY — do NOT skip it.** Run each detection command below and include the results in the summary.

**10a. RTK (Token Compression)**

```bash
which rtk 2>/dev/null && rtk --version 2>/dev/null
```

- **If found:** No action needed. The user's global CLAUDE.md should already have RTK instructions. Just note "RTK detected" in the summary.
- **If NOT found:** Add to the summary:
  > **RTK not installed** (recommended). Saves 60-90% tokens on CLI output. Install: https://github.com/rtk-ai/rtk

**10b. claude-mem (Persistent Memory)**

```bash
claude plugin list 2>&1 | grep claude-mem
```

- **If found:** Note "claude-mem detected" in the summary. Then ask: "Do you use CI&T's Flow proxy? (yes/no)"
  - If **yes**: check if `_FLOW_PROXY_API_KEY` is set in the environment or `~/.zshrc`. If set, copy the custom worker and configure the SessionStart hook:
    ```bash
    PLUGIN_PATH=$(find ~/.claude/plugins -path "*/einstein-workflow/worker/obs-daemon.mjs" 2>/dev/null | head -1)
    if [ -n "$PLUGIN_PATH" ]; then
      cp "$PLUGIN_PATH" ~/.claude/hooks/obs-daemon.mjs
      echo "Worker copied to ~/.claude/hooks/obs-daemon.mjs"
    fi
    ```
    Then add the SessionStart hook to `~/.claude/settings.json` (user-level, NOT project-level):
    ```json
    {
      "hooks": {
        "SessionStart": [{
          "matcher": "startup",
          "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/obs-daemon.mjs start", "timeout": 5 }]
        }]
      }
    }
    ```
  - If **no**: No extra config needed. claude-mem works out of the box.
- **If NOT found:** Add to the summary:
  > **claude-mem not installed** (recommended). Persistent memory across sessions. Install: `claude plugin install claude-mem`

**10c. Maestri**

```bash
$MAESTRI_CLI list 2>/dev/null || maestri list 2>/dev/null
```

- **If found:** Note "Maestri detected" in the summary. Remind: "Run `/einstein-workflow:setup-maestri` to create the workspace."
- **If NOT found:** Add to the summary:
  > **Maestri not detected.** Multi-terminal orchestration for the Tech Lead workflow. Download: https://www.themaestri.app
  > You can still use the agents directly without Maestri.

### Step 11: Summary

Tell the user:

**Files created/updated:**
- `CLAUDE.md` — project context (single source of truth)
- `.claude/settings.json` — MCP servers and permissions
- `.claude/WORKFLOW.md` — agent topology
- `.claude/agents/` — 16 agent files installed (including security-reviewer and lexicon)
- `.claude/rules/` — 3 rule files installed

**Conflicts resolved:** (list any files that were backed up or skipped)

**Tools detected:**
- RTK: {installed / not installed — install from https://github.com/rtk-ai/rtk}
- claude-mem: {installed / not installed — `claude plugin install claude-mem`}
- Maestri: {detected / not detected — https://www.themaestri.app}

**Next steps:**
1. {If Maestri detected:} Run `/einstein-workflow:setup-maestri` to create the workspace
2. {If tools missing:} Install the recommended tools listed above
3. Test: ask the tech-lead agent to analyze a feature
4. Commit the generated files (add `.claude/settings.local.json` to `.gitignore`)

**Re-running this wizard:**
- Safe to re-run anytime. It detects existing files and asks before overwriting.
- Use it after plugin updates to get new agent versions: "Just re-run `/einstein-workflow:setup-project`"
