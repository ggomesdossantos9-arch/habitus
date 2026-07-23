# Habitus

Monorepositório do MVP do TCC Habitus. A Fase 1 contém a API Express e o schema MySQL.

## Backend local

Requer Node.js 22 e MySQL 8. Copie `backend/.env.example` para `backend/.env`. Gere um par RSA local com `npm run keys:generate` e copie as duas variáveis exibidas para o `.env`. Não compartilhe a chave privada. Depois:

```bash
cd backend
npm install
npm run keys:generate
npm run db:migrate
npm test
npm run dev
```

O backend falha ao iniciar quando variáveis obrigatórias estão ausentes, evitando configuração insegura silenciosa.
