---
name: api-security
description: Checklist de seguranca de API da CI&T. Use ao criar, modificar ou revisar endpoints de API, rotas REST, controllers, middlewares de autenticacao ou qualquer codigo de API.
---

# Seguranca de API

Ao trabalhar com APIs, siga TODAS as regras abaixo. Baseado no checklist de seguranca de API da CI&T (v2.1) e OWASP API Security Top 10.

## Autenticacao

- Use padroes de autenticacao: JWT, OAuth 2.0 (NUNCA Basic Auth)
- Nao reinvente autenticacao, geracao de tokens ou armazenamento de senhas - use padroes conhecidos
- Implemente Max Retry e bloqueio de tentativas de autenticacao
- Criptografe todos os dados confidenciais
- Ao autenticar com sucesso, emita token para autorizar requisicoes futuras
- Valide o token antes de processar cada requisicao
- Gerencie sessao: tempo de vida dos tokens e revogacao

## JWT (JSON Web Token)

- Use chave secreta (JWT Secret) aleatoria e complexa
- NUNCA use o algoritmo informado no header do payload - force HS256 ou RS256 no backend
- Defina TTL e RTTL o menor possivel
- NUNCA armazene dados sensiveis no payload JWT (ele pode ser facilmente decodificado)
- Evite armazenar muitos dados no JWT (headers tem limite de tamanho)

## OAuth

- Valide redirect_uri no servidor contra lista de URLs conhecidas
- Retorne codigos de negociacao, nao tokens de acesso (nao permita response_type=token)
- Use parametro state com hash aleatorio para prevenir CSRF no fluxo OAuth
- Defina e valide scope para cada aplicacao

## Acesso e Transporte

- Implemente rate limiting / throttling contra DDoS e forca bruta
- Use HTTPS obrigatorio (NUNCA HTTP em producao)
- Use header HSTS com SSL para evitar SSL Strip
- Desative listagens de diretorio e SourceMap em producao
- Para APIs privadas, permita acesso apenas de IPs/hosts em whitelist

## Requisicao

- Use metodo HTTP correto: GET (obter), POST (criar), PUT/PATCH (atualizar), DELETE (apagar)
- Valide Content-Type da requisicao (aceite apenas formatos suportados)
- Valide Accept header (responda 406 Not Acceptable se nao suportado)
- Sanitize conteudo da requisicao contra XSS, SQL Injection, Remote Code Execution
- NUNCA coloque dados sensiveis na URL - use header Authorization
- Use apenas criptografia server-side
- Use API Gateway para cache, rate limiting, quota e deploy

## Processamento

- Verifique continuamente que endpoints protegidos exigem autenticacao
- Use /me/orders em vez de /user/654321/orders (nao exponha ID do usuario)
- Use UUID em vez de IDs sequenciais
- Se processar XML, desative entity parsing (prevenir XXE) e entity expansion (prevenir XML bomb)
- Use CDN para uploads de arquivos
- Para operacoes pesadas, use workers/queues para evitar bloqueio HTTP
- Desative modo debug em producao (DEBUG=false)
- Use stacks nao executaveis quando disponivel

## Resposta

- Envie X-Content-Type-Options: nosniff
- Envie X-Frame-Options: deny
- Envie Content-Security-Policy: default-src 'none'
- Remova headers de identificacao: X-Powered-By, Server, X-AspNet-Version
- Envie Content-Type correto na resposta (ex: application/json)
- NUNCA retorne senhas, credenciais ou tokens nas respostas
- Use codigos HTTP corretos: 200, 201, 400, 401, 403, 405, 406, 429, 500

## CI/CD

- Cubra a API com testes unitarios e de integracao
- Use code review obrigatorio (sem auto-aprovacao)
- Valide componentes com antivirus/antimalware antes de deploy
- Execute SAST e DAST continuamente
- Verifique dependencias para vulnerabilidades conhecidas
- Implemente rollback de deploy

## Armazenamento de Senhas

- Use hash com salt: bcrypt, argon2, scrypt ou PBKDF2
- Gere salt unico por usuario
- Armazene salt separado do hash
