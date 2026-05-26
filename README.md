# einstein-workflow

Plugin Claude Code para times Einstein. Instala um workflow completo de desenvolvimento AI com Tech Lead, especialistas, security gate, brainstorm squad — tudo orquestrado via Maestri.

Stack-agnostic: os agents definem **metodologia**, o projeto define **contexto** via CLAUDE.md, e o claude-mem absorve os **padroes reais** do codebase.

## Quick Start

```bash
# 1. Instalar o plugin
claude plugin install PauloHFS-ciandt/einstein-workflow

# 2. Abrir o projeto
cd seu-projeto && claude

# 3. Rodar o wizard
/einstein-workflow:setup-project
```

O wizard pergunta sobre o projeto e gera:

- `CLAUDE.md` — contexto do projeto (stack, paths, convencoes)
- `.claude/agents/` — 16 agents copiados para o projeto
- `.claude/rules/` — 3 rules copiadas para o projeto
- `.claude/settings.json` — MCP servers, permissoes, env vars
- `.claude/WORKFLOW.md` — topologia de agents e fluxo

Depois, configurar o Maestri:
```
/einstein-workflow:setup-maestri
```

Gera `.maestri/` com terminais: Tech Lead, Backend, Frontend, Mobile, AppSec, Shell.

Seguro re-rodar apos atualizacao do plugin.

---

## Pre-requisitos

| Ferramenta | Obrigatorio | Para que serve |
|---|---|---|
| **Claude Code CLI** | Sim | Runtime dos agents |
| **Node.js >= 18** | Sim | Hooks e worker |
| **Maestri** | Sim | Tech Lead delega via `maestri ask` |
| **Azure CLI** (`az login`) | Se usar Azure DevOps | Auth do MCP de Azure DevOps |
| **RTK** | Recomendado | Compressao de tokens (60-90% economia) |
| **claude-mem** | Recomendado | Memoria persistente entre sessoes |

### Instalar RTK

Verifique o guia de instalação no repositorio oficial: [rtk-ai/rtk](https://github.com/rtk-ai/rtk)

### Instalar claude-mem + Worker customizado

O worker padrao do claude-mem nao funciona com o proxy da CI&T. O plugin inclui um worker customizado (`worker/obs-daemon.mjs`) que chama o proxy direto via curl.

**1. Instalar o plugin claude-mem:**
```bash
claude plugin install claude-mem
```

**2. Configurar a API key** (adicionar ao `~/.zshrc`):
```bash
readonly _FLOW_PROXY_API_KEY="sua-chave-do-flow-proxy"
```

**3. Iniciar o worker customizado:**
```bash
# Encontrar o path do plugin instalado
PLUGIN_PATH=$(ls -d ~/.claude/plugins/cache/*/einstein-workflow/*/worker/obs-daemon.mjs 2>/dev/null | head -1)

# Iniciar como daemon (auto-termina apos 30min idle)
node "$PLUGIN_PATH" start

# Outros comandos
node "$PLUGIN_PATH" status   # verificar se ta rodando
node "$PLUGIN_PATH" run      # rodar em foreground (debug)
node "$PLUGIN_PATH" drain    # processar todas as observacoes pendentes
node "$PLUGIN_PATH" stop     # parar
```

**4. Auto-start (opcional)** — adicionar ao `~/.claude/settings.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [{
          "type": "command",
          "command": "node /caminho/do/plugin/worker/obs-daemon.mjs start",
          "timeout": 5
        }]
      }
    ]
  }
}
```

**5. Terminal Maestri** — criar um terminal "Shell" no workspace que roda `node .../obs-daemon.mjs run` para manter o worker ativo com logs visiveis.

**Web viewer:** `http://localhost:37740`

Desabilitar memoria nativa do Claude Code em `~/.claude/settings.json`:
```json
{ "env": { "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1" } }
```

---

## Arquitetura

3 camadas independentes:

```
PLUGIN (metodologia)     CLAUDE.md (contexto)     claude-mem (padroes)
  "o que fazer"            "neste projeto"          "como se faz aqui"

backend-engineer.md   +  CLAUDE.md             +  learn-codebase
(Clean Architecture,     (Express, Sequelize,      (absorve patterns reais
 layering rules,          src/app/controllers/,     do codigo: imports,
 testing methodology,     PostgreSQL,               naming, estrutura,
 security practices)      yarn, Jest)               convencoes locais)
```

- **Agents** = metodologia pura — zero codigo, zero nomes de lib
- **CLAUDE.md** = contexto do projeto — gerado pelo wizard `/setup-project`
- **claude-mem** = padroes reais — absorvidos via `/learn-codebase`

Atualiza a metodologia uma vez no plugin e todos os projetos se beneficiam. Cada projeto tem seu proprio contexto, sem conflito.

---

## O que vem no plugin

### 16 Agents

**Core Team (delegados via Maestri):**

| Agent | Model | Papel |
|---|---|---|
| tech-lead | opus | Orquestrador — delega via Maestri, enforce security gate |
| backend-engineer | sonnet | Especialista backend — Clean Architecture, migrations, logging |
| frontend-engineer | sonnet | Especialista frontend — Page-Module-Fragment, forms, routing |
| mobile-engineer | sonnet | Especialista mobile — gateways, stores, theme tokens, legacy migration |
| security-reviewer | sonnet | AppSec — revisa codigo contra checklists CI&T |
| lexicon | sonnet | Prompt Engineer — analisa, otimiza e refina prompts de agents, skills, CLAUDE.md |

**Brainstorm Squad (usados durante `/brainstorm`):**

| Agent | Papel |
|---|---|
| api-contract-designer | Design de superficie REST (endpoints, auth, paginacao) |
| data-model-designer | Design de schema (entidades, indices, migrations) |
| edge-case-hunter | Catalogo de failure modes e race conditions |
| integration-impact-analyst | Mapa de impacto cross-projeto |
| po-analyst | Criterios de aceite, JTBD, risk register |
| ux-consistency-reviewer | Consistencia UX, empty/loading/error states |

**Workflow:**

| Agent | Papel |
|---|---|
| doc-shepherd | Mantem docs atualizados apos code changes |
| pattern-extractor | Documenta patterns reutilizaveis |
| plan-sync | Sincroniza plans com implementacao real |
| readme-writer | Gera/atualiza READMEs |

### Security Gate (CI&T AppSec)

Sistema de review de seguranca embutido. O Tech Lead enforce como gate obrigatorio antes de todo PR.

**4 checklists como skills:**
- `/einstein-workflow:secure-coding` — OWASP Top 10, validacao, crypto, headers, cookies
- `/einstein-workflow:api-security` — JWT, OAuth, rate limiting, HTTPS, response headers
- `/einstein-workflow:frontend-security` — XSS, CSRF, LGPD, CSP, SRI
- `/einstein-workflow:architecture-security` — STRIDE, Zero Trust, DevSecOps, Privacy by Design

**Comando:** `/einstein-workflow:security-review` — roda review completo nas mudancas atuais.

**Fluxo:** CRITICAL bloqueia PR. WARNING deve ser resolvido ou aceito. INFO e informativo.

### Azure DevOps MCP

MCP oficial da Microsoft (`@azure-devops/mcp`) — embutido no plugin, zero install.

**90 tools:** work items, sprints, repos, pipelines, wiki, test plans, builds, queries WIQL.

**Auth:** `az login` (Azure CLI).

**Config:** o wizard `/setup-project` configura automaticamente:
```json
{ "env": { "ADO_ORG": "sua-org", "ADO_PROJECT": "seu-projeto", "ADO_TEAM": "seu-time" } }
```

### 4 Hooks

| Hook | Evento | O que faz |
|---|---|---|
| track-edit.mjs | PreToolUse (Edit/Write) | Rastreia edits de codigo vs docs por sessao |
| doc-guard-stop.mjs | Stop | Lembra de atualizar docs se so codigo mudou; roda tsc |
| block-env-edits.sh | PreToolUse (Edit/Write) | Bloqueia escrita em .env (permite .env.tpl) |
| lint-on-edit.sh | PostToolUse (Edit/Write) | Auto-lint apos editar arquivo (detecta projeto automatico) |

### 3 Rules

| Rule | O que faz |
|---|---|
| commits.mdc | Formato `[TICKET-XXXX] type(scope): subject`, ingles, imperative |
| context7-documentation.mdc | Usar Context7 MCP antes de implementar com libs |
| no-unsolicited-markdown.mdc | Nao criar .md sem pedido explicito |

### 9 Skills

| Skill | O que faz |
|---|---|
| `/einstein-workflow:setup-project` | Wizard de configuracao do projeto |
| `/einstein-workflow:setup-maestri` | Gerador de topologia Maestri |
| `/einstein-workflow:create-migration` | Gerador de migration (le ORM do CLAUDE.md) |
| `/einstein-workflow:create-endpoint` | Gerador de endpoint REST (le framework do CLAUDE.md) |
| `/einstein-workflow:generate-spec` | Spec SDD + cenarios BDD a partir de work item Azure DevOps |
| `/einstein-workflow:secure-coding` | Checklist secure coding CI&T |
| `/einstein-workflow:api-security` | Checklist API security CI&T |
| `/einstein-workflow:frontend-security` | Checklist frontend security CI&T |
| `/einstein-workflow:architecture-security` | Checklist architecture security CI&T |

### 1 Worker

| Worker | O que faz |
|---|---|
| obs-daemon.mjs | Processa observacoes do claude-mem via proxy CI&T (substitui SDK quebrado) |

---

## Conflitos com config existente

| Componente | Comportamento | Solucao |
|---|---|---|
| **Agents** | Projeto sobrescreve plugin (mesmo nome) | `/setup-project` copia pro projeto com deteccao de conflito + backup .bak |
| **Rules** | Plugins nao distribuem rules | `/setup-project` copia pro `.claude/rules/` |
| **Hooks** | Aditivos (ambos rodam) | Identicos sao deduplicados; remover duplicatas se notar double behavior |
| **Skills** | Namespaced (`/einstein-workflow:*`) | Sem conflito possivel |
| **CLAUDE.md** | Wizard pergunta antes de sobrescrever | Merge manual ou substituir |

---

## Fluxo de trabalho

```
Voce fala com o Tech Lead (Maestri)
  |
  |-- "implementa feature X no backend"
  |     └── Tech Lead delega → Backend Engineer (maestri ask)
  |
  |-- "preciso de uma tela nova no mobile"
  |     └── Tech Lead delega → Mobile Engineer (maestri ask)
  |
  |-- "quero fazer brainstorm dessa feature"
  |     └── Tech Lead lanca 6 agents em paralelo
  |         (api-contract, data-model, edge-cases, impact, PO, UX)
  |
  |-- "cria PR"
  |     └── Tech Lead delega review → AppSec Engineer (obrigatorio)
  |         Se CRITICAL → bloqueia PR
  |         Se limpo → cria PR + link work item
  |
  |-- "gera spec do card #12345"
  |     └── /einstein-workflow:generate-spec
  |
  |-- "review de seguranca"
  |     └── /einstein-workflow:security-review
```

---

## Licenca

Uso interno — Hospital Israelita Albert Einstein / CI&T
