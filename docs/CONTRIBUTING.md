# Contributing to einstein-workflow

Guia para contribuidores internos (Hospital Israelita Albert Einstein / CI&T).

---

## Arquitetura do Repositório

```
einstein-workflow/
├── .claude-plugin/
│   └── marketplace.json        # Registro do marketplace self-hosted
├── plugins/
│   └── einstein-workflow/      # O plugin em si
│       ├── .claude-plugin/
│       │   └── plugin.json     # Manifesto: versão, MCP servers, hooks
│       ├── agents/             # 16 arquivos .md (1 por agent)
│       ├── skills/             # 9 diretórios (1 por skill, com SKILL.md)
│       ├── commands/           # Commands expostos via /einstein-workflow:*
│       ├── hooks/              # Scripts executados em eventos (PreToolUse, Stop, etc.)
│       ├── rules/              # Rules .mdc copiadas para .claude/rules/ dos projetos
│       └── worker/             # obs-daemon.mjs (claude-mem proxy CI&T)
├── docs/
│   ├── install.md              # Automated setup guide (Quick Start)
│   └── CONTRIBUTING.md         # Este arquivo
└── README.md
```

---

## Filosofia de Design

3 camadas independentes — **não misturar**:

| Camada | O que define | Onde vive |
|---|---|---|
| **Plugin** | Metodologia — como trabalhar | Este repositório |
| **CLAUDE.md** | Contexto do projeto — stack, paths, convenções | Gerado pelo `/setup-project` no projeto-alvo |
| **claude-mem** | Padrões reais — absorvidos via `/learn-codebase` | Memória persistente por projeto |

**Regra de ouro:** agents devem ser **stack-agnostic**. Nenhum arquivo em `agents/` ou `skills/` deve citar nomes de bibliotecas, frameworks ou paths específicos de projeto. Toda referência de stack vai no CLAUDE.md gerado.

---

## Versionamento

O plugin segue **semver** no `plugins/einstein-workflow/.claude-plugin/plugin.json`.

| Tipo de mudança | Bump |
|---|---|
| Bugfix em hook/skill/agent | `PATCH` (1.0.x) |
| Nova skill, agent ou comando | `MINOR` (1.x.0) |
| Mudança breaking (rename de agent, remoção de skill) | `MAJOR` (x.0.0) |

Sempre bumpe a versão antes de commitar mudanças funcionais. Isso garante que `claude plugin update` detecta a nova versão.

---

## Adicionando um Agent

1. Crie `plugins/einstein-workflow/agents/<nome>.md`
2. Estrutura mínima:
   ```markdown
   ---
   name: <nome>
   description: >
     <Descrição clara de quando este agent é invocado — 1-3 frases>
   model: claude-sonnet-4-5  # ou claude-opus-4-5 para agents orquestradores
   ---

   <System prompt do agent>
   ```
3. Se o agent é do Core Team (delegado via Maestri), adicione-o à topologia em `skills/setup-maestri/SKILL.md`
4. Documente no README — tabela da seção "16 Agents"
5. Bumpe a versão (MINOR)

---

## Adicionando uma Skill

1. Crie o diretório `plugins/einstein-workflow/skills/<nome>/`
2. Crie `SKILL.md` dentro dele com as instruções da skill
3. Se a skill precisa de arquivos de suporte (templates, scripts), coloque no mesmo diretório
4. Documente no README — tabela da seção "9 Skills"
5. Bumpe a versão (MINOR)

**Nota:** skills são expostas como `/einstein-workflow:<nome>` automaticamente pelo namespace do plugin.

---

## Adicionando um Hook

Hooks ficam em `plugins/einstein-workflow/hooks/` e são registrados no `plugin.json`.

1. Crie o script (`.mjs` para Node.js, `.sh` para bash)
2. Adicione ao `plugin.json` na seção `hooks`:
   ```json
   {
     "type": "command",
     "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/meu-hook.mjs"
   }
   ```
3. Use `${CLAUDE_PLUGIN_ROOT}` para referenciar caminhos — nunca paths absolutos
4. Bumpe a versão (PATCH ou MINOR conforme impacto)

---

## Workflow de Contribuição

```bash
# 1. Branch a partir de main
git checkout -b feat/minha-feature

# 2. Implementa mudanças

# 3. Bumpe a versão em plugin.json

# 4. Commit seguindo a convenção do projeto
git commit -m "[TICKET-XXXX] 🚀 feat(agents): add meu-agent"

# 5. Push e abre PR para main
```

**Convenção de commits** (ver `rules/commits.mdc`):
```
[TICKET-XXXX] <emoji> <type>(<scope>): <subject>
```

---

## Testando Localmente

Para testar mudanças antes de publicar:

```bash
# 1. Registrar o marketplace apontando para o repo local
claude plugin marketplace add /caminho/para/einstein-workflow

# 2. Reinstalar para pegar as mudanças
claude plugin update einstein-workflow@einstein-workflow

# 3. Reiniciar o Claude Code
```

Alternativamente, para testar uma skill específica sem reinstalar:

```bash
# Ler o SKILL.md diretamente e executar como se fosse o plugin
# (útil para iterações rápidas)
```

---

## Publicando uma Nova Versão

1. Bumpe a versão em `plugins/einstein-workflow/.claude-plugin/plugin.json`
2. Commit e push para `main`
3. Usuários atualizam com:
   ```bash
   claude plugin marketplace update einstein-workflow
   claude plugin update einstein-workflow@einstein-workflow
   ```

Não há processo de release automatizado — o marketplace self-hosted serve direto do `main`.
