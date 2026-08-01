# Habitus

Monorepositório do MVP do TCC Habitus. O projeto reúne backend em Node.js/Express, frontend em React/Vite e banco MySQL para a proposta do trabalho de conclusão de curso.

## Requisitos

- Node.js 22+
- MySQL 8+
- npm

## Configuração do MySQL

1. Crie um banco chamado `habitus`.
2. Opcionalmente, use o script:

```bash
cd backend
node create-db.js
```

3. Ajuste a conexão no arquivo [backend/.env](backend/.env) com a URL do MySQL.

Exemplo:

```env
DATABASE_URL=mysql://root:root@127.0.0.1:3306/habitus
```

## Configuração do ambiente

Copie [backend/.env.example](backend/.env.example) para [backend/.env](backend/.env) e preencha os valores.

Gere as chaves RSA para JWT:

```bash
cd backend
npm install
npm run keys:generate
```

Copie os dois valores gerados para `JWT_PRIVATE_KEY_BASE64` e `JWT_PUBLIC_KEY_BASE64` no arquivo `.env`.

Para a IA Groq, defina:

```env
GROQ_API_KEY=sua-chave
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile
```

## Executar localmente

### Backend

```bash
cd backend
npm install
npm run db:migrate
npm test
npm run dev
```

O backend ficará disponível em `http://127.0.0.1:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará disponível em `http://127.0.0.1:5173`.

## Publicação no Railway

1. Conecte este repositório ao Railway.
2. Crie um serviço usando o diretório `backend`.
3. Defina as variáveis de ambiente no painel do Railway:
   - `DATABASE_URL`
   - `JWT_PRIVATE_KEY_BASE64`
   - `JWT_PUBLIC_KEY_BASE64`
   - `TOKEN_HMAC_SECRET`
   - `GROQ_API_KEY`
   - `GROQ_BASE_URL`
   - `GROQ_MODEL`
   - `WEB_ORIGINS`
   - `TERMS_VERSION`
   - `PRIVACY_VERSION`
4. Faça o deploy. O comando de start já está configurado em [backend/railway.json](backend/railway.json).

## Validação

Os testes foram executados com sucesso:

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```
