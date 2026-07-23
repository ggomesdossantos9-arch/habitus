# Fase 2 — Frontend e autenticação

## Resultado

A base do frontend foi construída com React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Zod e Context API. O fluxo usa a API real; não há dados simulados no bundle de produção.

## Estrutura

```text
frontend/
├── qa/                    # harness isolado para QA visual
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── ui/
│   ├── contexts/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── habits/
│   │   ├── journal/
│   │   ├── profile/
│   │   └── telemetry/
│   ├── routes/
│   ├── services/
│   └── utils/
├── test/
├── .env.example
├── index.html
├── package.json
├── vercel.json
└── vite.config.mjs
```

## Fluxo de autenticação

1. Login e cadastro validam os dados com Zod e enviam para a API.
2. O access token fica somente em memória; o refresh token permanece em cookie `HttpOnly` administrado pelo backend.
3. O Axios adiciona `Authorization: Bearer` às requisições autenticadas.
4. Em resposta `401`, uma única renovação em andamento é compartilhada entre as requisições concorrentes.
5. Se a renovação falhar, o token e o usuário do `AuthContext` são removidos, e as rotas protegidas voltam ao login.
6. Na inicialização, o app tenta renovar a sessão e consulta `GET /api/v1/users/me`.
7. Logout usa token CSRF, encerra a sessão no backend e limpa o estado local.

## Rotas do frontend

- `/login`
- `/cadastro`
- `/app/dashboard`
- `/app/habitos`
- `/app/diario`
- `/app/telemetria`
- `/app/perfil`

As rotas sob `/app` são protegidas. `vercel.json` reescreve acessos diretos para `index.html`, preservando o roteamento do SPA em produção.

## Variáveis de ambiente

- `VITE_API_URL`: origem do backend.
- `VITE_TERMS_VERSION`: versão dos termos aceita no cadastro.
- `VITE_PRIVACY_VERSION`: versão da política aceita no cadastro.

## Segurança e operação

- Para produção, frontend e backend devem usar HTTPS.
- Preferir subdomínios do mesmo domínio registrável para reduzir restrições de cookies entre sites.
- CORS deve aceitar apenas as origens oficiais e credenciais.
- A rotação de refresh token entre múltiplas abas ainda depende da política do backend; deve ser exercitada em homologação antes da publicação.

## Próxima fase

Implementar o CRUD real de hábitos, incluindo listagem, criação, edição, arquivamento/exclusão conforme contrato da API e estados vazio, carregando, erro e sucesso.
