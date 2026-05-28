---
name: architecture-security
description: Checklist de seguranca de arquitetura da CI&T. Use ao desenhar, discutir ou revisar arquitetura de sistemas, infraestrutura, cloud, pipelines CI/CD, diagramas de fluxo ou decisoes arquiteturais.
---

# Seguranca de Arquitetura

Ao trabalhar com arquitetura de sistemas, siga TODAS as regras abaixo. Baseado no checklist de arquitetura da CI&T (v1.1), ISO 27001, ISO 27002, NIST CSF, LGPD e GDPR.

## 1. Governanca, Risco e Conformidade

### Analise de Requisitos
- Identifique o objetivo de negocio da arquitetura
- Mapeie riscos regulatorios: dados sujeitos a LGPD/GDPR, BACEN, PCI?
- Identifique o apetite de risco do sistema

### Classificacao da Informacao
- Defina a classificacao das informacoes criadas/consumidas no projeto
- Inventarie e classifique os ativos de dados processados e armazenados

### Threat Modeling (STRIDE + DREAD)
- Identifique e priorize ameacas ANTES da implementacao
- Crie DFD (Diagrama de Fluxo de Dados) detalhando: processos (APIs, servers, lambdas), fluxo de dados (HTTPS, SQL), armazenamento (bancos, buckets), limites de confianca (VPCs)
- Para cada componente do DFD, analise as 6 categorias STRIDE:
  - **Spoofing**: alguem consegue se passar por outro usuario/sistema?
  - **Tampering**: dados podem ser alterados em transito ou no banco?
  - **Repudiation**: usuario pode negar ter realizado acao critica sem provas?
  - **Information Disclosure**: mensagens de erro vazam dados? dados sensiveis em logs ou sem criptografia?
  - **Denial of Service**: aplicacao e escalavel? endpoints podem ser sobrecarregados?
  - **Elevation of Privilege**: usuario comum consegue executar acoes de admin?
- Defina contramedidas para cada ameaca baseado no risco (Critico, Alto, Medio)

### Governanca
- Defina politicas de seguranca e ownership (data owner, system owner, product owner, security champions)
- Gestao de SI em contratos com terceiros (due diligence, SLAs)
- Controles de segregacao de funcoes (SoD)
- Defina RTO e RPO e requisitos de continuidade

## 2. Security By Design e Zero Trust

### Gestao de Identidade e Acesso
- Defina IdP para SSO (Azure AD, OKTA, IAM OCI)
- Exija MFA para acessos admin, remotos e processos criticos
- Siga principio do menor privilegio (PoLP) em toda a arquitetura
- Use RBAC e/ou ABAC para controle de acesso
- Gestao de sessao segura: timeouts, refresh tokens, revoke
- Segregue contas (usuarios vs admins)
- Use cofre de credenciais para acessos privilegiados
- Provisionamento/desprovisionamento automatizado e auditavel

### Zero Trust
- Macro-segmentacao: segregue redes (Producao, Dev, QA)
- Micro-segmentacao: isole workloads
- Implemente WAF para aplicacoes web
- Implemente Anti-DDoS
- Priorize ZTNA sobre VPN tradicional para acesso remoto
- Comunicacao SEMPRE autenticada e criptografada
- Defina hardening e baseline de seguranca

## 3. DevSecOps

### Privacy by Design
- Garanta acesso apenas aos dados necessarios (data minimization)
- Anonimize dados em ambientes de dev e homologacao
- Implemente DLP para dados sensiveis
- Defina Data Retention Policy
- Mapeie Data Flow

### Seguranca na Esteira CI/CD
- NUNCA hardcode credenciais no codigo - use cofre de segredos
- Integre SAST no commit/pull request
- Integre SCA (analise de bibliotecas terceiras)
- Automatize DAST no ambiente de homologacao
- Defina Secure Coding Standards e processo de code review
- APIs com OAuth2.0/OIDC, rate limiting, schema validation, API Gateway

### Ambientes
- Dev/Homolog/Prod devem ser isolados com controles de rede e IAM
- Dados de producao NAO devem ser usados em dev/homolog - use dados mascarados ou fakes

## 4. Operacoes, Monitoramento e Resposta

### Criptografia
- TLS 1.2 ou superior para TODA comunicacao (interna e externa)
- Bancos de dados, storages e backups criptografados

### Logs e Monitoramento
- Capture eventos de autenticacao (sucesso e falha)
- Capture alteracoes de privilegio
- Capture acesso a dados sensiveis

### Vulnerabilidades e Patches
- Arquitetura deve suportar scans de vulnerabilidade
- Defina SLAs para aplicacao de correcoes

### Continuidade e Resposta a Incidentes
- Backup 3-2-1 com testes de restauracao periodicos
- Arquitetura deve permitir isolamento rapido de componentes comprometidos
- Redundancia e alta disponibilidade validadas
- Testes regulares de failover e restauracao

## 5. Verificacao Final

- Pentest (Black/Grey/White Box) antes do Go-Live
- Em cloud, inclua testes de misconfiguration e escalonamento IAM
- Documente arquitetura, politicas e decisoes de risco
- Defina KPIs e KRIs de seguranca
- Dashboards para tomada de decisao
- Auditorias e verificacoes periodicas
