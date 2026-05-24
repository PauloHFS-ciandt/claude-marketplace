# einstein-workflow

AI-powered development workflow for Einstein teams. Provides Tech Lead orchestration via Maestri, specialist agents (Backend, Frontend, Mobile), AppSec security gate, brainstorm squad, and project setup wizards.

## Prerequisites

### Required

- **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code`
- **Node.js >= 18**
- **Maestri** — multi-terminal orchestrator (the Tech Lead delegates exclusively via `maestri ask`)

### Required Tools

#### RTK (Rust Token Killer)

Token compression for Bash output — saves 60-90% tokens on dev operations.

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/cortesi/rtk/main/install.sh | bash

# Verify
rtk --version
rtk gain
```

RTK works automatically via the plugin's PreToolUse hook — every Bash command passes through it.

To add the RTK hook to your global settings, add to `~/.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "rtk hook claude"
          }
        ]
      }
    ]
  }
}
```

#### claude-mem + Custom Worker (CI&T Proxy)

Persistent memory across Claude Code sessions. The standard claude-mem worker **does not work** with CI&T's corporate proxy — this plugin includes a custom worker (`worker/obs-daemon.mjs`) that bypasses the SDK and calls the proxy directly via curl.

**Step 1: Install claude-mem plugin**
```bash
claude plugin install claude-mem
```

**Step 2: Configure your API key**

Add to your `~/.zshrc` (the worker reads it from here):
```bash
readonly _FLOW_PROXY_API_KEY="your-ciandt-flow-proxy-key"
```

Alternatively, set `FLOW_PROXY_KEY` as an env var or in `~/.claude-mem/.env`.

**Step 3: Start the custom worker**

Instead of `npx claude-mem start`, use the plugin's daemon:
```bash
# Start as background daemon (auto-terminates after 30min idle)
node /path/to/einstein-workflow/worker/obs-daemon.mjs start

# Check status
node /path/to/einstein-workflow/worker/obs-daemon.mjs status

# Run in foreground (debug)
node /path/to/einstein-workflow/worker/obs-daemon.mjs run

# One-shot: process all pending observations
node /path/to/einstein-workflow/worker/obs-daemon.mjs drain

# Stop daemon
node /path/to/einstein-workflow/worker/obs-daemon.mjs stop
```

**Step 4: Auto-start via SessionStart hook**

Add to `~/.claude/settings.json` so the worker starts automatically:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "node /path/to/einstein-workflow/worker/obs-daemon.mjs start",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Replace `/path/to/einstein-workflow` with your actual plugin install path. To find it:
```bash
ls ~/.claude/plugins/cache/*/einstein-workflow/*/worker/obs-daemon.mjs
```

**Step 5: Maestri terminal**

Create a dedicated "Shell" terminal in your Maestri workspace that runs:
```bash
node /path/to/einstein-workflow/worker/obs-daemon.mjs run
```

This keeps the worker alive with visible logs while you work.

**Web viewer:** `http://localhost:37740` (while worker is running)

**Configuration in `~/.claude/settings.json`:**
```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1"
  }
}
```

**How it works:** The daemon polls claude-mem's SQLite DB every 30s for pending observations, sends them to the CI&T Flow proxy (`flow.ciandt.com/flow-llm-proxy`) using Claude Sonnet, and writes the generated observations back. It auto-terminates after 30min idle.

---

## Quick Start

```bash
# 1. Install the plugin
claude plugin install /path/to/einstein-workflow

# 2. Open your project
cd your-project
claude

# 3. Run the setup wizard
/einstein-workflow:setup-project
```

The wizard asks about your project and generates:
- `CLAUDE.md` — project context for all agents
- `.claude/settings.json` — MCP servers and permissions
- `.claude/WORKFLOW.md` — team topology
- `.claude/agents/` — 15 agent files copied into the project
- `.claude/rules/` — 3 rule files copied into the project

Safe to re-run after plugin updates to get new agent/rule versions.

## Setup Maestri

After `/setup-project`, configure Maestri terminals:

```
/einstein-workflow:setup-maestri
```

This generates `.maestri/` with role definitions for each specialist terminal:
- **Tech Lead** — entry point, orchestrates everything
- **Backend** — implementation specialist
- **Frontend** — implementation specialist
- **Mobile** — implementation specialist
- **AppSec Engineer** — mandatory security gate before PRs
- **Shell** — claude-mem worker

---

## What You Get

### 15 Agents

**Core Team:**
- **tech-lead** (opus) — orchestrator, delegates via Maestri, enforces security gate
- **backend-engineer** (sonnet) — Node.js/Express, Clean Architecture, ORM patterns
- **frontend-engineer** (sonnet) — React/TypeScript CMS, Page-Module-Fragment layering
- **mobile-engineer** (sonnet) — React Native/Expo, gateway pattern, migration protocol

**Security:**
- **security-reviewer** (sonnet) — AppSec specialist, reviews code against CI&T security checklists

**Brainstorm Squad** (used during `/brainstorm`):
- **api-contract-designer** — REST API surface design
- **data-model-designer** — database schema design
- **edge-case-hunter** — failure mode analysis
- **integration-impact-analyst** — cross-project impact mapping
- **po-analyst** — acceptance criteria and risk register
- **ux-consistency-reviewer** — UX pattern consistency

**Workflow:**
- **doc-shepherd** — documentation maintenance
- **pattern-extractor** — reusable pattern documentation
- **plan-sync** — plan and work-plan synchronization
- **readme-writer** — README generation

### Security Gate (CI&T AppSec)

Built-in security review system based on CI&T's development security checklists.

**Skills (checklists):**
- `/einstein-workflow:secure-coding` — backend coding rules (OWASP Top 10, input validation, crypto, headers)
- `/einstein-workflow:api-security` — API security (JWT, OAuth, rate limiting, HTTPS)
- `/einstein-workflow:frontend-security` — frontend security (XSS, CSRF, LGPD, CSP)
- `/einstein-workflow:architecture-security` — architecture security (STRIDE, Zero Trust, DevSecOps)

**Command:**
- `/einstein-workflow:security-review` — runs a full security review on current changes

**How it works:** The Tech Lead enforces a mandatory security gate before every PR. It delegates to the AppSec Engineer terminal, which uses the security-reviewer agent and applicable checklists. CRITICAL findings block the PR.

### 4 Hooks

| Hook | Event | Purpose |
|---|---|---|
| track-edit.mjs | PreToolUse (Edit/Write) | Tracks code vs doc edits per session |
| doc-guard-stop.mjs | Stop | Reminds to update docs if only code changed; runs tsc |
| block-env-edits.sh | PreToolUse (Edit/Write) | Prevents writing to .env files |
| lint-on-edit.sh | PostToolUse (Edit/Write) | Auto-lints after file edits |

### 3 Rules

- **commits** — `[TICKET-XXXX] type(scope): subject` format
- **context7-documentation** — use Context7 MCP before implementing with libraries
- **no-unsolicited-markdown** — don't create .md files without explicit request

### 8 Skills

| Skill | Purpose |
|---|---|
| `/einstein-workflow:setup-project` | Project configuration wizard |
| `/einstein-workflow:setup-maestri` | Maestri workspace topology generator |
| `/einstein-workflow:create-migration` | Database migration generator (ORM-agnostic) |
| `/einstein-workflow:create-endpoint` | REST endpoint generator (framework-agnostic) |
| `/einstein-workflow:secure-coding` | CI&T secure coding checklist |
| `/einstein-workflow:api-security` | CI&T API security checklist |
| `/einstein-workflow:frontend-security` | CI&T frontend security checklist |
| `/einstein-workflow:architecture-security` | CI&T architecture security checklist |

---

## Conflict Handling

The plugin is designed to coexist safely with existing Claude Code configurations.

### Agents
Plugin agents are **copied** into the project's `.claude/agents/` by `/setup-project`. This avoids the Claude Code shadowing problem where project-level agents override plugin agents with the same name. If you already have agents with the same names, the wizard asks before overwriting and creates `.bak` backups.

### Rules
Claude Code **does not load rules from plugins** — only from `.claude/rules/`. The wizard copies rule files into the project. Existing rules with the same name trigger a conflict prompt.

### Hooks
Plugin hooks run **in addition to** project hooks (additive, not overriding). Identical commands are deduplicated by Claude Code automatically. If you notice double behavior (e.g., two lint passes), remove the project-level duplicate from `.claude/settings.json`.

### Skills
Plugin skills are automatically namespaced as `/einstein-workflow:skill-name`. No conflict with project skills possible.

### Existing CLAUDE.md
If the project already has a CLAUDE.md, the wizard asks before overwriting. You can merge manually or let it replace.

---

## Architecture

Agents define the **role** (methodology, quality bars, patterns). Projects define the **context** (stack, paths, conventions) via CLAUDE.md.

```
Plugin (role)          +  Project (context)         =  Working Agent
                                                 
backend-engineer.md       CLAUDE.md                    Knows Express +
(Clean Architecture,      (Express, Sequelize,          Sequelize patterns
 testing methodology,      src/app/controllers/,        for THIS project
 security practices)       PostgreSQL)
```

This separation means:
- Update methodology once in the plugin, all projects benefit
- Each project has its own context, no conflicts
- New projects get the full workflow with `/setup-project`

## Supported Stacks

| Layer | Frameworks |
|---|---|
| Backend | Express, Fastify, NestJS |
| Frontend | React + Vite, Next.js, Vue |
| Mobile | React Native + Expo, bare React Native |
| ORM | Sequelize, Prisma, TypeORM |
| Database | PostgreSQL, MySQL, MongoDB |
| Testing | Jest |

## License

Internal — Hospital Israelita Albert Einstein
