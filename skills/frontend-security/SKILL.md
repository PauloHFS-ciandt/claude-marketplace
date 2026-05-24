---
name: frontend-security
description: Checklist de seguranca frontend e UI/UX da CI&T. Use ao criar ou modificar componentes de interface, formularios, paginas web, aplicacoes SPA, CSS, HTML ou qualquer codigo frontend.
---

# Seguranca Frontend e UI/UX

Ao trabalhar com codigo frontend, siga TODAS as regras abaixo. Baseado no checklist de seguranca frontend da CI&T (v1.1).

## Validacao de Entrada

- Valide e sanitize TODAS as entradas do usuario no frontend
- Remova ou escape caracteres especiais (<, >, &, ", ') que possam injetar codigo malicioso
- Teste o codigo com dados invalidos para garantir que a validacao funcione
- Valide tambem na camada de servico (backend) - validacao frontend e complementar, nao substituta

## Protecao CSRF

- Use tokens CSRF unicos em cada requisicao ao servidor
- Verifique que o token da requisicao corresponde ao esperado no servidor
- Verifique a origem da requisicao (Origin/Referer header)
- Restrinja metodos HTTP que modificam estado (POST, PUT, DELETE) a requisicoes de confianca

## SSL/TLS

- Use SSL/TLS para criptografar TODAS as comunicacoes sensiveis
- Force HTTPS em todas as paginas (redirecionar HTTP para HTTPS)
- Notifique o usuario se o certificado SSL/TLS nao for valido
- Habilite HSTS para garantir conexao HTTPS apos primeira visita

## Feedback de Seguranca ao Usuario

- Forneca notificacoes claras sobre acoes de seguranca (autenticacao bem-sucedida, erro de senha)
- Use icones visuais para indicar se a pagina e segura (cadeado, HTTPS)
- Use indicadores visuais (barras de progresso, animacoes) durante acoes de seguranca em andamento
- Mensagens de erro NAO devem vazar informacoes internas do sistema

## Conformidade LGPD/GDPR

- Forneca politica de privacidade clara e acessivel
- Peca consentimento explicito antes de coletar dados pessoais
- Armazene dados pessoais de acordo com a legislacao aplicavel
- Informe ao usuario quais dados estao sendo coletados e por que

## Usabilidade e Seguranca

- Se o app lida com dados confidenciais, considere bloquear screenshots (quando aplicavel)
- Use campos seguros para dados sensiveis (type="password" com validacao de forca)
- Valide forca de senha: tamanho minimo, combinacao de letras, numeros e simbolos
- Crie banners ou pop-ups sobre phishing para conscientizacao do usuario
- Informe usuarios sobre criptografia SSL e por que e padrao

## Autenticacao e Autorizacao no Frontend

- Verifique se o usuario esta autenticado e autorizado antes de processar requisicoes
- Se autenticacao e feita no backend, garanta que informacoes de auth estejam disponiveis no frontend (ex: JWT)
- Armazene info de usuario autenticado em sessao ou cookie seguro
- Verifique presenca e validade das credenciais ao processar cada requisicao

## Boas Praticas Adicionais

- Habilite Subresource Integrity (SRI) para verificar integridade de recursos externos
- NUNCA ative modo debug em producao
- Nao exponha configuracao ou dados internos em mensagens de erro
- Use Content-Security-Policy para limitar scripts e recursos inline
- Se usar SPA (React, Vue, Angular): injete CSP no HTML e configure INLINE_RUNTIME_CHUNK=false
- Use apenas dependencias homologadas pelo cliente/projeto
