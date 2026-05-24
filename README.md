# einstein-workflow

AI-powered development workflow for Einstein teams. Provides Tech Lead orchestration, specialist agents (Backend, Frontend, Mobile), brainstorm squad, security gates, and project setup wizards for Maestri + Claude Code.

## Quick Start

```bash
claude plugin install /path/to/einstein-workflow
cd your-project
claude
```

Then run:
```
/einstein-workflow:setup-project
```

The wizard will ask about your project and generate:
- `CLAUDE.md` — project context for all agents
- `.claude/settings.json` — MCP servers and permissions
- `.claude/WORKFLOW.md` — team topology
- `.claude/agents/` — 14 agent files copied into the project
- `.claude/rules/` — 3 rule files copied into the project

Safe to re-run after plugin updates to get new agent/rule versions.

## Setup Maestri

After `/setup-project`, optionally configure Maestri terminals:

```
/einstein-workflow:setup-maestri
```

This generates `.maestri/` with role definitions for each specialist terminal.

## What You Get

### 14 Agents

**Core Team:**
- **tech-lead** (opus) — orchestrator, delegates via Maestri, enforces security gate
- **backend-engineer** (sonnet) — Node.js/Express, Clean Architecture, ORM patterns
- **frontend-engineer** (sonnet) — React/TypeScript CMS, Page-Module-Fragment layering
- **mobile-engineer** (sonnet) — React Native/Expo, gateway pattern, migration protocol

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

### 5 Hooks

| Hook | Event | Purpose |
|---|---|---|
| notification.mjs | Notification | macOS terminal notification |
| track-edit.mjs | PreToolUse (Edit/Write) | Tracks code vs doc edits |
| doc-guard-stop.mjs | Stop | Reminds to update docs; runs tsc |
| block-env-edits.sh | PreToolUse (Edit/Write) | Prevents writing to .env files |
| lint-on-edit.sh | PostToolUse (Edit/Write) | Auto-lints after file edits |

### 3 Rules

- **commits** — `[TICKET-XXXX] type(scope): subject` format
- **context7-documentation** — use Context7 MCP before implementing with libraries
- **no-unsolicited-markdown** — don't create .md files without explicit request

### 4 Skills

- `/einstein-workflow:setup-project` — project configuration wizard
- `/einstein-workflow:setup-maestri` — Maestri workspace topology generator
- `/einstein-workflow:create-migration` — database migration generator (ORM-agnostic)
- `/einstein-workflow:create-endpoint` — REST endpoint generator (framework-agnostic)

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

## Architecture

Agents define the **role** (methodology, quality bars, patterns). Projects define the **context** (stack, paths, conventions) via CLAUDE.md.

```
Plugin (role)          +  Project (context)         =  Working Agent
─────────────          ─────────────────────        ──────────────
backend-engineer.md       CLAUDE.md                    Knows Express +
(Clean Architecture,      (Express, Sequelize,          Sequelize patterns
 testing methodology,      src/app/controllers/,        for THIS project
 security practices)       PostgreSQL)
```

This separation means:
- Update methodology once in the plugin, all projects benefit
- Each project has its own context, no conflicts
- New projects get the full workflow with `/setup-project`

## Requirements

- Claude Code CLI
- Node.js >= 18
- Maestri (optional, for multi-terminal orchestration)
- RTK (optional, for token compression)

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
