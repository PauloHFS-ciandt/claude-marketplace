---
name: secure-coding
description: Regras de codificacao segura da CI&T para backend e codigo em geral. Use ao escrever, modificar ou revisar qualquer codigo de aplicacao. Cobre validacao de entrada, protecao contra injecao, criptografia, headers, cookies, logging e dependencias.
---

# Desenvolvimento Seguro - Regras Gerais e Backend

Ao escrever ou modificar codigo, siga TODAS as regras abaixo. Estas sao diretrizes obrigatorias da CI&T baseadas em OWASP Top 10, ISO 27001/27002 e boas praticas de S-SDLC.

## Validacao de Entrada

- Valide e sanitize TODAS as entradas do usuario antes de processa-las
- Valide no nivel da camada de servico, nao apenas no controller
- Rejeite entradas que nao correspondam ao formato esperado (whitelist, nao blacklist)
- Limite o tamanho e tipo de arquivos enviados pelo usuario

## Protecao contra Injecao

- Use ORM em vez de queries SQL diretas
- Se usar SQL direto, use SEMPRE prepared statements/parameterized queries
- Nunca concatene entrada do usuario em queries SQL
- Para XML, desative entity parsing e entity expansion para evitar XXE e XML bomb
- Escape dados de saida para prevenir XSS

## Autenticacao e Sessao

- Use padroes conhecidos: JWT e OAuth 2.0 (nunca Basic Auth em producao)
- Implemente rate limiting e bloqueio temporario contra forca bruta (max 5 tentativas)
- Configure timeout para sessoes
- Tokens de sessao devem ser fortes e imprevisiveis
- Verifique autorizacao mesmo para usuarios ja autenticados
- Permita e incentive 2FA; force para administradores

## Criptografia e Senhas

- NUNCA armazene senhas em texto puro - use hash com salt (bcrypt, argon2, scrypt ou PBKDF2)
- Gere um salt unico por usuario
- Armazene o salt separado do hash
- Criptografe todos os dados sensiveis antes de armazenar
- Use SSL/TLS para toda comunicacao (HTTPS obrigatorio)
- Obfusque chaves primarias com UUID para resistir a ataques de enumeracao

## Credenciais e Segredos

- NUNCA coloque credenciais, chaves de API ou segredos no codigo (hardcoded)
- Use gerenciador de segredos (AWS Secrets Manager, OCI Vault, etc)
- Nao logue dados sensiveis (chaves API, senhas, tokens, dados pessoais)
- Filtre dados confidenciais antes de gravar em logs

## Headers HTTP

- Nao exponha versao do servidor (NGINX: server_tokens off)
- Habilite Content-Security-Policy para mitigar XSS
- Habilite Strict-Transport-Security (HSTS)
- Configure Referrer-Policy
- Configure Permissions-Policy
- Envie X-Content-Type-Options: nosniff
- Envie X-Frame-Options: deny (ou frame-ancestors 'none' via CSP)
- Remova headers de identificacao: X-Powered-By, Server, X-AspNet-Version

## Cookies

- Cookies de autenticacao: httpOnly=true, secure=true, SameSite=Lax (minimo)
- Restrinja cookies a dominio especifico
- Configure expiracao razoavel
- Ative protecao CSRF em todas as views que realizam acoes para usuarios autenticados

## Logging e Monitoramento

- Registre: data/hora, usuario, IP, tipo de solicitacao, path da API, resposta
- Registre acoes do usuario (login, alteracao de senha) para auditoria
- Nao registre dados sensiveis nos logs
- Monitore a aplicacao continuamente para atividades suspeitas

## Dependencias e Bibliotecas

- Mantenha todas as dependencias atualizadas com correcoes de seguranca
- Verifique vulnerabilidades com OWASP Dependency Check ou similar
- Use apenas dependencias homologadas pelo cliente/projeto
- Nao envie codigo para plataformas nao homologadas

## Codigo Limpo e Qualidade

- Siga principios de Clean Code
- Nunca ative modo debug em producao
- Nao mantenha codigo backend na raiz web
- Habilite Subresource Integrity (SRI) para recursos externos
- Nao armazene dados de cartao de credito no sistema
- Evite redirecionamentos para URLs fornecidas pelo usuario
- Use bibliotecas de template com protecao XSS embutida

## CSRF

- Adicione tokens CSRF a todas as requisicoes que mudem estado do servidor
- Adicione header X-CSRF-TOKEN e valide no servidor
- Configure rotas que mudam estado para aceitar apenas POST
- Nunca desative CSRF sem justificativa documentada
