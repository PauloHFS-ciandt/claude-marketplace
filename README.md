# claude-marketplace

Marketplace Claude Code para times Einstein. Distribui o plugin `einstein-workflow` com um workflow completo de desenvolvimento AI: Tech Lead, especialistas, security gate, brainstorm squad — tudo orquestrado via Maestri.

Stack-agnostic: os agents definem **metodologia**, o projeto define **contexto** via CLAUDE.md, e o claude-mem absorve os **padroes reais** do codebase.

## Quick Start

**Requisito:** o terminal Claude Code precisa estar dentro de um canvas do [Maestri](https://www.themaestri.app). Se ainda nao instalou, veja a secao [Pre-requisitos](#pre-requisitos) abaixo.

1. Abra o Maestri
2. Crie um terminal Claude Code no canvas, apontando para o diretorio do seu projeto
3. Cole isto no terminal:

> Install and configure einstein-workflow by following the instructions here:
> https://raw.githubusercontent.com/PauloHFS-ciandt/claude-marketplace/main/docs/install.md

O agente registra o marketplace, instala o plugin, configura o projeto, e monta o workspace do Maestri automaticamente — terminais, conexoes, roles, tudo no canvas.

### Setup manual (alternativa)

```bash
# 1. Registrar o marketplace (uma vez)
claude plugin marketplace add PauloHFS-ciandt/claude-marketplace

# 2. Instalar o plugin
claude plugin install PauloHFS-ciandt@einstein-workflow

# 3. (Opcional) Instalar worker para obs-daemon
claude plugin install PauloHFS-ciandt@claude-mem-ciandt-worker

# 4. Abrir o projeto
cd seu-projeto && claude

# 5. Configurar projeto
/einstein-workflow:setup-project

# 6. Montar workspace Maestri
/einstein-workflow:setup-maestri
```

O wizard gera:

- `CLAUDE.md` — contexto do projeto (stack, paths, convencoes)
- `.claude/agents/` — 16 agents copiados para o projeto
- `.claude/rules/` — 3 rules copiadas para o projeto
- `.claude/settings.json` — MCP servers, permissoes, env vars
- `.claude/WORKFLOW.md` — topologia de agents e fluxo
- Terminais Maestri: Tech Lead, Backend, Frontend, Mobile, AppSec

Seguro re-rodar apos atualizacao do plugin.

### Atualizando

```bash
# 1. Atualizar o indice do marketplace (pull do repo)
claude plugin marketplace update PauloHFS-ciandt/claude-marketplace

# 2. Atualizar o plugin
claude plugin update PauloHFS-ciandt@einstein-workflow

# 3. (Se instalou) Atualizar worker
claude plugin update PauloHFS-ciandt@claude-mem-ciandt-worker

# 4. Reiniciar o Claude Code para aplicar
```

Agents e rules copiados para o `.claude/` do projeto **nao atualizam automaticamente** — re-rode `/einstein-workflow:setup-project` para pegar as versoes novas (o wizard detecta conflitos e faz backup `.bak` antes de sobrescrever).

---

## Pre-requisitos

| Ferramenta | Obrigatorio | Para que serve | Instalar |
|---|---|---|---|
| **Claude Code CLI** | Sim | Runtime dos agents | Ja esta rodando se voce ve este terminal |
| **Node.js >= 18** | Sim | Hooks e worker | https://nodejs.org |
| **Maestri** | Sim | Orquestracao multi-terminal | https://www.themaestri.app |
| **Azure CLI** (`az login`) | Se usar Azure DevOps | Auth do MCP de Azure DevOps | https://learn.microsoft.com/cli/azure/install-azure-cli |
| **RTK** | Recomendado | Compressao de tokens (60-90% economia) | https://github.com/rtk-ai/rtk |
| **claude-mem** | Recomendado | Memoria persistente entre sessoes | `claude plugin install claude-mem` |
| **claude-mem-ciandt-worker** | Opcional | Worker para obs-daemon (requer claude-mem) | `claude plugin install PauloHFS-ciandt@claude-mem-ciandt-worker` |

> **O terminal do Quick Start DEVE estar dentro do Maestri.** O installer usa o CLI do Maestri para criar terminais, roles e portais no canvas. Sem Maestri, o setup-maestri falha.

### claude-mem + Worker customizado (CI&T)

O wizard `/setup-project` detecta o claude-mem automaticamente e configura tudo — incluindo o worker customizado para o proxy da CI&T. Basta ter o claude-mem instalado e a variavel `_FLOW_PROXY_API_KEY` no `~/.zshrc` antes de rodar o Quick Start.

```bash
# 1. Instalar
claude plugin install claude-mem

# 2. (Opcional) Instalar worker para obs-daemon
claude plugin install PauloHFS-ciandt@claude-mem-ciandt-worker

# 3. Configurar API key (adicionar ao ~/.zshrc)
readonly _FLOW_PROXY_API_KEY="sua-chave-do-flow-proxy"

# 4. Rodar o Quick Start — o wizard faz o resto
```

**Web viewer:** `http://localhost:37740`

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

### 1 Worker (Plugin separado)

| Worker | O que faz | Instalar |
|---|---|---|
| obs-daemon.mjs | Processa observacoes do claude-mem via proxy CI&T (substitui SDK quebrado) | `claude plugin install PauloHFS-ciandt@claude-mem-ciandt-worker` |

> **Nota:** O worker `obs-daemon` foi movido para um plugin separado (`claude-mem-ciandt-worker`) para facilitar atualizacoes independentes. Instale apenas se usar claude-mem com proxy CI&T.

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