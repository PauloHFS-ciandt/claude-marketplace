---
description: "Interactive wizard that configures a project for the einstein-workflow plugin. Generates CLAUDE.md, installs agents and rules into the project, configures .claude/settings.json, and creates .claude/WORKFLOW.md. Run this once when onboarding a new project. Safe to re-run — detects conflicts."
---

# /setup-project — Project Configuration Wizard

You are an interactive setup wizard for the **einstein-workflow** plugin. Your job is to collect project information through conversation and install the complete workflow into the project directory.

## What You Generate

1. **`CLAUDE.md`** at the repository root — the single source of truth for all agents
2. **`.claude/settings.json`** — project-level hooks, MCP servers, and permissions
3. **`.claude/WORKFLOW.md`** — agent topology and team structure reference
4. **`.claude/agents/*.md`** — copies of all 15 plugin agents into the project (avoids shadowing issues)
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

Create `.claude/settings.json` with:

```json
{
  "hooks": {},
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
| **Maestri** | Multi-terminal orchestration (required) | Download from maestri.dev |
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

Copy all 14 agent files from the plugin into the project's `.claude/agents/` directory.

**The plugin root is available via `${CLAUDE_PLUGIN_ROOT}`.** Use it to find the agent source files.

```
Source: ${CLAUDE_PLUGIN_ROOT}/agents/*.md
Target: .claude/agents/
```

**Conflict detection:** Before copying each file:
1. Check if `.claude/agents/{name}.md` already exists
2. If it does, compare content (first 3 lines are enough — check the YAML `name:` field)
3. If the existing file has the SAME name but DIFFERENT content, ask the user:
   - "You already have `.claude/agents/{name}.md`. Replace with the einstein-workflow version? (Your version will be backed up to `.claude/agents/{name}.md.bak`)"
4. If the existing file is identical to the plugin version, skip silently

**Always create `.claude/agents/` directory if it doesn't exist.**

Agent files to install (15):
- tech-lead.md, backend-engineer.md, frontend-engineer.md, mobile-engineer.md
- security-reviewer.md (CI&T AppSec — mandatory security gate)
- api-contract-designer.md, data-model-designer.md, edge-case-hunter.md
- integration-impact-analyst.md, po-analyst.md, ux-consistency-reviewer.md
- doc-shepherd.md, pattern-extractor.md, plan-sync.md, readme-writer.md

### Step 7: Install Rules

Copy all 3 rule files from the plugin into the project's `.claude/rules/` directory.

```
Source: ${CLAUDE_PLUGIN_ROOT}/rules/*.mdc
Target: .claude/rules/
```

**Same conflict detection as agents:**
1. Check if `.claude/rules/{name}.mdc` already exists
2. If different content, ask before overwriting (backup to `.bak`)
3. If identical, skip silently

**Always create `.claude/rules/` directory if it doesn't exist.**

Rule files to install (3):
- commits.mdc
- context7-documentation.mdc
- no-unsolicited-markdown.mdc

### Step 8: Install Hook Guard

Check if the project's `.claude/settings.json` already has hooks defined.

**If NO hooks exist:** Add the plugin's recommended hooks:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/block-env-edits.sh"
          }
        ]
      }
    ]
  }
}
```

**If hooks ALREADY exist:** Do NOT overwrite. Instead, inform the user:
- "Your project already has hooks configured in `.claude/settings.json`."
- "The einstein-workflow plugin provides these hooks via `plugin.json` and they will run automatically in addition to your project hooks."
- "If you experience duplicate behavior (e.g., double lint-on-edit), you may want to remove the project-level hook."

The plugin hooks (notification, track-edit, doc-guard-stop, block-env-edits, lint-on-edit) always run from the plugin's `plugin.json` — they don't need to be in the project settings. The only reason to add them to project settings is if the plugin is not installed (standalone mode).

### Step 9: Explore and Enrich

After generating the files, **explore the actual codebase** to fill in:
- Project Structure sections in CLAUDE.md (read actual directories)
- Key Commands (read package.json scripts)
- Path aliases (read tsconfig.json or babel.config.js)
- Environment variables (read .env.tpl or .env.example)

### Step 10: Summary

Tell the user:

**Files created/updated:**
- `CLAUDE.md` — project context (single source of truth)
- `.claude/settings.json` — MCP servers and permissions
- `.claude/WORKFLOW.md` — agent topology
- `.claude/agents/` — 15 agent files installed (including security-reviewer)
- `.claude/rules/` — 3 rule files installed

**Conflicts resolved:** (list any files that were backed up or skipped)

**Next steps:**
1. Run `/einstein-workflow:setup-maestri` to configure Maestri terminals (optional)
2. Test: ask the tech-lead agent to analyze a feature
3. Commit the generated files (add `.claude/settings.local.json` to `.gitignore`)

**Re-running this wizard:**
- Safe to re-run anytime. It detects existing files and asks before overwriting.
- Use it after plugin updates to get new agent versions: "Just re-run `/einstein-workflow:setup-project`"
