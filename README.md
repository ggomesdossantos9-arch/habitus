# Habitus

Habitus e um app fullstack para acompanhamento de habitos, diario cognitivo, emocoes e telemetria pessoal. O backend expõe uma API REST com autenticacao real, refresh token em cookie httpOnly, dados persistidos em MySQL e integracao opcional com Groq para analises por IA. O frontend React/Vite consome apenas dados reais da API.

## Tecnologias

- Backend: Node.js 22+, Express 5, Knex, MySQL 8, JWT com `jose`, bcrypt, Zod e Vitest.
- Frontend: React 19, Vite, React Router, Axios, Tailwind CSS e Phosphor Icons.
- Deploy: backend preparado para Railway ou Render; frontend preparado para Vercel.

## Instalacao

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Banco de Dados

Crie um banco MySQL e configure `DATABASE_URL` em `backend/.env`.

```env
DATABASE_URL=mysql://usuario:senha@127.0.0.1:3306/habitus
```

Execute as migrations:

```bash
cd backend
npm run db:migrate
```

## Variaveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

- `DATABASE_URL`
- `JWT_PRIVATE_KEY_BASE64`
- `JWT_PUBLIC_KEY_BASE64`
- `TOKEN_HMAC_SECRET`
- `WEB_ORIGINS`
- `TERMS_VERSION`
- `PRIVACY_VERSION`
- `GROQ_API_KEY`, opcional
- `GROQ_MODEL`, opcional e configuravel

Gere chaves JWT locais com:

```bash
cd backend
npm run keys:generate
```

Copie `frontend/.env.example` para `frontend/.env`. Em producao, `VITE_API_URL` deve ser a URL publica HTTPS do backend, nunca localhost.

## Execucao Local

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

URLs locais padrao:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:3000`
- Health check: `http://127.0.0.1:3000/health`

## Testes e Build

```bash
cd backend
npm test
npm run db:migrate
```

```bash
cd frontend
npm test
npm run build
```

## Endpoints Principais

- `GET /health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET/PATCH/DELETE /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `GET/POST /api/v1/habits`
- `GET/PATCH/DELETE /api/v1/habits/:habitId`
- `POST /api/v1/habits/:habitId/restore`
- `GET/PUT/DELETE /api/v1/habits/:habitId/checkins/:date`
- `GET /api/v1/dashboard/summary`
- `GET/POST /api/v1/journals`
- `GET/PATCH/DELETE /api/v1/journals/:entryId`
- `GET /api/v1/emotions/catalog`
- `GET/POST /api/v1/emotions`
- `GET /api/v1/telemetry/summary`
- `GET /api/v1/telemetry/distribution`
- `GET /api/v1/telemetry/trends`
- `GET /api/v1/telemetry/habit-correlations`
- `POST /api/v1/ai/insights`

## Deploy

Backend:

- Railway: use o diretorio `backend`, configure as variaveis de ambiente e use `npm run start`.
- Render: use `backend/render.yaml` e configure `DATABASE_URL`, `WEB_ORIGINS`, chaves JWT, `TOKEN_HMAC_SECRET` e variaveis Groq no painel.
- O backend usa `PORT` fornecida pela plataforma e oferece `GET /health` para health check.
- Execute `npm run db:migrate` no ambiente de producao antes ou durante o release.

Frontend:

- Vercel: use o diretorio `frontend`.
- Configure `VITE_API_URL` com a URL publica do backend.
- `frontend/vercel.json` redireciona rotas React para `index.html`.

## Seguranca de Git

Nao versione `.env`, `node_modules`, `dist`, logs ou `backend/mysql-data`. O diretorio local de dados MySQL e ignorado e deve permanecer fora do repositorio.
