---
description: Executa revisao de seguranca no codigo atual usando os checklists da CI&T
---

Execute uma revisao completa de seguranca usando o agente security-reviewer da CI&T.

Se argumentos foram fornecidos ("$ARGUMENTS"), revise especificamente esses arquivos ou diretorio.
Se nenhum argumento foi fornecido, revise as alteracoes recentes (git diff) ou o diretorio atual.

Use o agente @"security-reviewer (agent)" para realizar a revisao e apresente o relatorio completo ao usuario.
