# Fase 1 — Backend, banco e autenticação

## Escopo entregue

- API Node.js 22 ESM com Express 5, configuração validada e encerramento gracioso.
- MySQL 8 via Knex/mysql2, pool e sessão UTC.
- Snapshot SQL completo das 14 tabelas e migration reversível inicial.
- SQL imutável versionado dentro da migration, separado do snapshot evolutivo `schema.sql`.
- Cadastro transacional com consentimentos vigentes, bcrypt e e-mail normalizado.
- Login com erro genérico, auditoria mínima e mitigação de enumeração temporal.
- JWT RS256 curto validando algoritmo, `kid`, emissor, audiência, tipo e `auth_version`.
- Refresh opaco com hash SHA-256, rotação, bloqueio de linha e detecção de reuso por família.
- Logout, logout global, reautenticação curta e consulta do perfil atual.
- Helmet, CORS allowlist, validação de Origin/CSRF, rate limit, limite de corpo, cookies seguros, logs redigidos e Problem Details.
- Ownership futuro reforçado por FKs compostas, emoção primária única no banco e lock otimista previsto no Diário.

## Decisão consciente

Recuperação de senha permanece documentada na arquitetura, mas não foi implementada nesta fase porque não existe provedor de e-mail aprovado. Criar token sem entregar um fluxo utilizável seria uma solução temporária e insegura.

## Tabelas criadas

`users`, `user_consent_events`, `refresh_tokens`, `password_reset_tokens`, `auth_events`, `habits`, `habit_schedule_versions`, `habit_schedule_weekdays`, `habit_checkins`, `emotions`, `cognitive_journal_entries`, `emotional_events`, `emotional_event_items` e `ai_insights`.

O Knex cria adicionalmente `knex_migrations` e `knex_migrations_lock` como metadados operacionais de migration; elas não fazem parte do domínio Habitus nem do snapshot funcional.

## Rotas implementadas

- `GET /health`
- `GET /ready`
- `GET /api/v1/auth/csrf`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `POST /api/v1/auth/reauthenticate`
- `GET /api/v1/users/me`

## Operação

As chaves RSA são fornecidas em PEM codificado em Base64. O refresh token nunca é gravado em texto puro. Em produção, `COOKIE_SECURE=true`; deployments cross-site devem usar `COOKIE_SAME_SITE=none`, HTTPS, origem exata e o fluxo `/auth/csrf`.

## Próximos ajustes

1. Provisionar MySQL 8 de teste e produção e executar `up`, rollback e `up` em ambos. O Docker local não disponibilizou daemon nesta validação.
2. Fazer benchmark do custo bcrypt no Railway antes do freeze de produção.
3. Definir domínio próprio ou confirmar cookies cross-site entre Vercel e Railway.
4. Aprovar provedor/transacionais de e-mail antes de implementar recuperação de senha.
5. Definir e validar o catálogo real de emoções antes de criar seed de domínio.
6. Trocar o rate limit em memória por store compartilhado antes de executar mais de uma instância da API.

## Verificação local desta entrega

- Node.js portátil oficial 22.23.0, verificado por SHA-256.
- Primeira execução: 4 arquivos e 8 testes aprovados.
- Auditoria npm após atualização do Vitest: zero vulnerabilidades.
- Suíte ampliada para autenticação HTTP, JWT, middleware, reuso de refresh, corrida de cadastro e invariantes do schema.
- 25 arquivos JavaScript passaram em `node --check`; snapshot e SQL versionado da migration são equivalentes.
- A reexecução integral da suíte ampliada ficou pendente porque a plataforma recusou novas execuções escaladas após atingir o limite operacional da sessão.
