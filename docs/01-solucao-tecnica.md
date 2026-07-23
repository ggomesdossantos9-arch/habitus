# Habitus — Solução técnica do MVP

> Status: proposta arquitetural v0.1 — aguardando aprovação antes da implementação  
> Data-base: 22/06/2026  
> Escopo analisado: requisitos fornecidos na solicitação. O repositório não contém o texto formal do TCC, protótipos ou regras de negócio adicionais.

## 1. Resumo executivo

O Habitus será uma aplicação web responsiva para acompanhamento de hábitos, registros diários, emoções e Diário Cognitivo. O sistema será construído como um monólito modular: uma SPA React no frontend, uma API REST Node.js/Express no backend e MySQL como fonte única da verdade.

Essa arquitetura reduz complexidade operacional, preserva separação de responsabilidades e é adequada ao prazo e ao tamanho do MVP de TCC. Microsserviços, filas e agregações persistidas ficam fora do MVP enquanto não houver evidência de necessidade.

### Objetivos do MVP

1. Permitir cadastro, login, logout e recuperação de senha com segurança.
2. Permitir criar, editar, arquivar e acompanhar hábitos.
3. Registrar diariamente progresso, conclusão e emoções relacionadas aos hábitos.
4. Oferecer um Diário Cognitivo estruturado.
5. Apresentar dashboard e telemetria emocional derivados dos dados reais do usuário.
6. Gerar reflexões não clínicas com Groq/Llama 3, mediante consentimento explícito.
7. Ser demonstrável, testável e implantável em Vercel e Railway até novembro de 2026.

### Fora do escopo inicial

- Rede social, compartilhamento público e gamificação competitiva.
- Aplicativos móveis nativos e funcionamento offline.
- Painel administrativo, salvo se o TCC o exigir.
- Diagnóstico, prescrição, tratamento ou aconselhamento clínico.
- Microsserviços, data warehouse e processamento assíncrono complexo.

## 2. Premissas e lacunas do TCC

Como o repositório está vazio, as decisões a seguir devem ser conferidas contra o documento formal do TCC antes de congelar o banco ou a API.

| Tema | Premissa de arquitetura | Validação pendente |
|---|---|---|
| Público | Um único papel: usuário autenticado | Personas, faixa etária e uso por menores |
| Hábitos | Diário, dias específicos ou meta semanal | Regras de frequência, pausa, atraso e edição retroativa |
| Sequência | Calculada a partir da agenda e dos registros | Definição acadêmica de streak e efeito de “pular” |
| Dia civil | Fuso configurado no perfil; timestamps em UTC | Mudança de fuso e horário de fechamento do dia |
| Emoções | Catálogo em português, intensidade 1–5, valência e energia | Vocabulário e escalas validados pelo TCC/UX |
| Diário Cognitivo | Registro estruturado inspirado em TCCognitiva | Campos obrigatórios e referencial metodológico |
| Telemetria | Tendências e distribuições, sem inferência diagnóstica | Indicadores e critérios acadêmicos de avaliação |
| Recuperação | Link de uso único enviado por e-mail | Provedor, remetente e domínio |
| IA | Opt-in explícito e minimização de dados | Política, retenção e modelo Groq ativo |
| Privacidade | Exportação, revogação e expurgo planejados | Base legal, prazo de retenção e texto de consentimento |

## 3. Decisões arquiteturais

### 3.1 Estilo geral

```text
Navegador
  └─ React + Vite + Tailwind + React Router
       └─ Axios / HTTPS / JSON
            └─ API REST Node.js + Express
                 ├─ MySQL (Railway)
                 ├─ provedor de e-mail a definir
                 └─ Groq API / modelo Llama configurável
```

- Monorepositório com `frontend`, `backend`, `database` e `docs`.
- Backend em monólito modular, organizado por camadas e domínio.
- API versionada em `/api/v1` e descrita em OpenAPI 3.1.
- MySQL é a única fonte de dados de negócio. Dashboard e telemetria são projeções calculadas, não dados mockados nem cópias autoritativas.
- Comunicação externa encapsulada por adaptadores (`EmailProvider` e `AIProvider`).
- Datas e horários persistidos em UTC; datas civis de acompanhamento usam o fuso do usuário.

### 3.2 Estrutura completa proposta

Esta árvore será criada somente após a aprovação desta arquitetura.

```text
habitus-app-main/
├─ frontend/
│  ├─ public/
│  ├─ src/
│  │  ├─ assets/
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  ├─ forms/
│  │  │  ├─ feedback/
│  │  │  └─ charts/
│  │  ├─ pages/
│  │  │  ├─ auth/
│  │  │  ├─ dashboard/
│  │  │  ├─ habits/
│  │  │  ├─ cognitive-diary/
│  │  │  ├─ emotional-telemetry/
│  │  │  └─ profile/
│  │  ├─ layouts/
│  │  ├─ services/
│  │  │  ├─ api/
│  │  │  ├─ auth/
│  │  │  ├─ habits/
│  │  │  ├─ diary/
│  │  │  ├─ dashboard/
│  │  │  └─ telemetry/
│  │  ├─ hooks/
│  │  ├─ contexts/
│  │  ├─ routes/
│  │  ├─ schemas/
│  │  ├─ utils/
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ tests/
│  │  ├─ unit/
│  │  └─ e2e/
│  ├─ .env.example
│  ├─ package.json
│  ├─ vite.config.js
│  └─ vercel.json
├─ backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  ├─ repositories/
│  │  ├─ routes/
│  │  ├─ middlewares/
│  │  ├─ models/
│  │  ├─ validators/
│  │  ├─ providers/
│  │  │  ├─ email/
│  │  │  └─ ai/
│  │  ├─ utils/
│  │  ├─ app.js
│  │  └─ server.js
│  ├─ tests/
│  │  ├─ unit/
│  │  ├─ integration/
│  │  └─ fixtures/
│  ├─ .env.example
│  └─ package.json
├─ database/
│  ├─ migrations/
│  ├─ seeds/
│  └─ schema.sql
├─ docs/
│  ├─ 01-solucao-tecnica.md
│  ├─ 02-modelagem-banco.md
│  ├─ 03-api-rest.md
│  ├─ 04-roadmap-sprints.md
│  ├─ openapi.yaml
│  ├─ adr/
│  ├─ testes/
│  └─ deploy/
├─ .editorconfig
├─ .gitignore
└─ README.md
```

Seeds serão usados apenas para catálogos reais e versionados, nunca para usuários, hábitos, métricas ou demonstrações fictícias.

## 4. Arquitetura frontend

### 4.1 Responsabilidades

- Renderizar páginas responsivas e acessíveis.
- Validar experiência e formato antes do envio, sem substituir a validação do backend.
- Manter access token apenas em memória e renovar a sessão de forma controlada.
- Consumir exclusivamente a API; nenhum dado de negócio será codificado como mock.
- Exibir estados explícitos de carregamento, vazio, erro, sucesso e falta de conexão.

### 4.2 Organização

- `pages`: composição das telas por rota.
- `components`: componentes reutilizáveis e sem regras de negócio de servidor.
- `layouts`: cascas pública e autenticada, navegação e regiões responsivas.
- `services`: cliente Axios e operações HTTP por domínio.
- `hooks`: coordenação de comportamento reutilizável.
- `contexts`: somente identidade/sessão, tema e preferências realmente globais.
- `routes`: definição de rotas, proteção e carregamento sob demanda.
- `schemas`: validação e contratos de formulário.

### 4.3 Estado e comunicação

- React Router controla rotas públicas e protegidas.
- Axios usa `baseURL`, `withCredentials`, timeout e `requestId`.
- Um interceptador pode tentar **uma única renovação** quando o access token expirar; requisições concorrentes aguardam a mesma promessa de refresh.
- TanStack Query é recomendado para cache de dados remotos, invalidação e retries seletivos.
- React Hook Form e Zod são recomendados para formulários.
- Gráficos devem partir de dados agregados pela API; Recharts é uma opção compatível.
- O frontend não calcula streak como fonte da verdade.

### 4.4 Rotas de interface

```text
/entrar
/cadastro
/esqueci-senha
/redefinir-senha
/app/dashboard
/app/habitos
/app/habitos/novo
/app/habitos/:id
/app/habitos/arquivados
/app/diario
/app/diario/novo
/app/diario/:id
/app/emocoes
/app/insights
/app/insights/:id
/app/perfil
/app/perfil/privacidade
/sessao-expirada
/* (404)
```

Após login, o usuário retorna ao destino protegido originalmente solicitado; no primeiro acesso, segue para uma orientação curta de criação do primeiro hábito. Desktop usará navegação lateral e mobile uma navegação inferior para destinos primários, mantendo rótulos, estado ativo e o comportamento nativo do botão voltar. Dashboard vazio sempre oferece uma próxima ação, em vez de apenas gráficos sem dados.

### 4.5 UX e acessibilidade

- Mobile first, seguindo WCAG 2.2 AA: landmarks, skip link, labels persistentes, foco visível, resumo de erros, mensagens por `aria-live`, alvos de toque adequados, zoom/reflow e preferência por movimento reduzido.
- Contraste mínimo AA e gráficos acompanhados por resumo textual e tabela equivalente.
- Emoções não serão codificadas somente por cor.
- Mensagens de IA terão rótulo, limitações e linguagem não clínica.
- Ações destrutivas terão confirmação e resultado recuperável quando aplicável.
- Conteúdo sensível não aparecerá em notificações, logs do navegador ou URLs.
- O link de redefinição coloca o token no fragmento da URL; a tela o lê e remove imediatamente com `history.replaceState`, usando `Referrer-Policy: no-referrer`.
- Formulários de autenticação mostram requisitos antes do envio, erros por campo, controle mostrar/ocultar senha e estados específicos para bloqueio, expiração da sessão e reset inválido/expirado.
- Diário Cognitivo usa etapas curtas, instruções neutras, rascunho/autosave no servidor e alerta ao sair. Texto do diário nunca é salvo em `localStorage`.
- Autosave informa `salvando`, `salvo` ou `falha ao salvar`, com tentativa manual e sem descartar o texto em memória durante a sessão.
- Dashboard prioriza “Hoje” e ações imediatas, usa linguagem não punitiva e mostra “dados insuficientes” antes de qualquer tendência.
- Telemetria também mostra “dados insuficientes”; telas distinguem `429`, indisponibilidade e erro parcial sem apagar conteúdo já carregado.
- Arquivamento de hábito será chamado de **Arquivar**, com desfazer; “Excluir” fica reservado à remoção definitiva de dados pessoais.

## 5. Arquitetura backend

### 5.1 Fluxo de uma requisição

```text
Route → Validator → Middleware de autenticação → Controller
      → Service → Repository → MySQL
                       └──────→ Provider externo
```

- `route`: registra método, caminho, middlewares e handler.
- `validator`: valida `params`, `query` e `body` com schemas reutilizáveis.
- `controller`: traduz HTTP para chamada de serviço; não contém regra de negócio.
- `service`: concentra autorização, regras, transações e casos de uso.
- `repository`: única camada que executa SQL parametrizado.
- `provider`: integra serviços externos sem contaminar o domínio.
- `middleware`: autenticação, CSRF, CORS, rate limit, erros e observabilidade.

### 5.2 Contratos HTTP

- JSON e UTF-8.
- Sucesso: `{ "data": ..., "meta": ... }`.
- Erro no padrão Problem Details: `type`, `title`, `status`, `code`, `detail`, `requestId` e `errors`.
- IDs públicos UUID; IDs numéricos internos nunca são expostos.
- Paginação com `cursor` e `limit` máximo.
- Toda consulta a recurso do usuário inclui `user_id` obtido do JWT; `userId` nunca vem do cliente.
- Recursos alheios retornam `404`, reduzindo enumeração e IDOR.

### 5.3 Regras transversais

- MySQL InnoDB, `utf8mb4`, pool de conexões e queries parametrizadas.
- Transações para operações em múltiplas tabelas.
- Helmet, CORS por allowlist, limite de corpo, rate limit e HTTPS.
- Logs estruturados com `requestId`, sem senha, token ou conteúdo do diário.
- Health check separado de readiness do banco.
- Migrations versionadas; `schema.sql` será snapshot reproduzível.
- Testes unitários de regra, integração com banco real isolado e E2E dos fluxos críticos.

As pastas obrigatórias por camada terão subpastas por domínio (`controllers/auth`, `services/habits`, `repositories/telemetry` etc.). Não haverá uma segunda árvore `modules`, evitando duas localizações possíveis para o mesmo caso de uso.

Stack complementar proposta: Knex com driver `mysql2` para queries, transações e migrations; Zod para contratos; `jose` para JWT RS256; bcrypt para senhas; Pino para logs; Vitest e Supertest no backend; Vitest/Testing Library e Playwright no frontend. A versão LTS do Node vigente no início da Fase 1 e as versões exatas das dependências serão fixadas em lockfiles e documentadas, sem intervalos flutuantes em produção.

## 6. Autenticação JWT

### 6.1 Estratégia

- **Access token:** JWT RS256, vida curta de 10–15 minutos.
- **Refresh token:** token opaco aleatório de 256 bits, vida de 7–30 dias, rotacionado a cada uso.
- O refresh token fica em cookie `HttpOnly` e `Secure`; apenas seu hash SHA-256 fica no banco.
- O access token fica somente em memória no frontend, nunca em `localStorage`.

Claims mínimas do JWT:

```json
{
  "iss": "habitus-api",
  "aud": "habitus-web",
  "sub": "uuid-publico-do-usuario",
  "jti": "uuid-do-token",
  "ver": 1,
  "type": "access",
  "iat": 0,
  "exp": 0
}
```

O header inclui `kid`. O middleware fixa algoritmo, `issuer`, `audience`, expiração e tipo, resolve a chave pública por `kid` e compara `ver` com `users.auth_version`. O payload não conterá perfil, emoção ou conteúdo do diário. A chave privada atual fica apenas no Railway; chaves públicas anteriores permanecem disponíveis por, no mínimo, a maior vida útil de access token durante uma rotação.

### 6.2 Fluxos

1. **Cadastro:** normaliza e-mail, valida senha, gera bcrypt e cria usuário/aceites obrigatórios em transação. Consentimento de IA é separado, opcional e nunca pré-marcado.
2. **Login:** compara hash, registra evento, emite access e refresh; falhas têm resposta genérica.
3. **Refresh:** valida cookie e CSRF, bloqueia a linha, revoga token atual e cria substituto na mesma família.
4. **Reuso:** se um refresh revogado for reapresentado, toda a família é revogada.
5. **Logout:** usa o refresh cookie para identificar e revogar a sessão, limpa cookie e access token em memória. O access token emitido expira em até 15 minutos.
6. **Logout global:** revoga todos os refresh tokens e incrementa `auth_version`, invalidando access tokens na próxima requisição.
7. **Recuperação:** cria token de uso único com 15–30 minutos, persiste somente hash e envia link.
8. **Redefinição:** consome token atomicamente, invalida todos os demais resets, altera bcrypt, incrementa `auth_version` e revoga todas as sessões.
9. **Reautenticação:** senha atual gera token JWT `type=reauth` por até cinco minutos, exigido para troca de senha e exclusão da conta.

Senhas terão mínimo inicial recomendado de 12 caracteres, limite de entrada compatível com os 72 bytes processados pelo bcrypt e custo calibrado no Railway (alvo inicial 12, sem fixá-lo sem benchmark). Usuários bloqueados não autenticam nem renovam sessão; usuários excluídos deixam de existir na base ativa. IPs de auditoria usam HMAC com segredo rotacionável, não hash simples.

O cookie de produção terá nome `__Secure-habitus_refresh`, `HttpOnly`, `Secure`, `Path=/api/v1/auth`, vida igual à sessão e `SameSite=Lax` em subdomínios same-site. No cenário cross-site, será `SameSite=None` com as proteções adicionais descritas abaixo.

### 6.3 Vercel e Railway

Vercel e Railway usam sites diferentes por padrão. A opção preferida é adotar domínios próprios no mesmo site, por exemplo `app.dominio` e `api.dominio`. Sem isso, o cookie exige `SameSite=None; Secure`, CORS com origem exata, `credentials: true`, validação de `Origin` e token CSRF double-submit em refresh/logout. Nunca será usado `Access-Control-Allow-Origin: *` com credenciais.

Verificação de e-mail não fará parte do MVP, evitando um fluxo incompleto sem requisito acadêmico. A conta poderá usar recuperação por e-mail; verificação será reavaliada se o TCC ou a política de abuso a exigir. Avatar e lembretes também ficam fora do MVP até existir armazenamento/canal de notificação aprovado.

## 7. Segurança, privacidade e IA

Os registros emocionais e o Diário Cognitivo podem conter dados pessoais sensíveis. A implementação deve incorporar LGPD desde o desenho:

- minimização, finalidade e consentimentos versionados;
- exportação JSON síncrona e exclusão física da conta após reautenticação;
- retenção documentada e backup compatível com a política;
- logs sem conteúdo sensível;
- segregação rigorosa por usuário;
- aviso de que o Habitus não é serviço médico ou de emergência.

Para Groq/Llama:

- chave somente no backend;
- interface `AIProvider` e adaptador `GroqProvider`;
- `GROQ_MODEL` configurável e validado por allowlist na Fase 7;
- consentimento `ai_processing` vigente antes de qualquer envio;
- nenhum nome, e-mail, ID ou dado desnecessário enviado ao provedor;
- backend constrói o contexto; o cliente não envia prompt livre;
- texto do diário é tratado como dado não confiável contra prompt injection;
- resposta JSON validada por schema e linguagem estritamente reflexiva, não clínica;
- timeout, idempotência, limites por usuário e retries apenas para erros transitórios;
- não persistir prompt bruto; registrar apenas metadados mínimos e conteúdo aprovado;
- fluxo de segurança específico para sinais de crise, sem produzir aconselhamento inadequado.

No MVP, a geração de insight será síncrona, com timeout e idempotência: retorna `201` quando concluída, `422` quando bloqueada por regra de segurança e `503` em indisponibilidade transitória. Não haverá estado pendente, polling ou worker implícito. A interface exibirá exatamente o período/recurso usado como fundamento.

O Habitus não monitora o texto do usuário como serviço de emergência. Recursos de ajuda e a mensagem “não monitoramos emergências” estarão permanentemente acessíveis no Diário e nos insights. Se o filtro da IA sinalizar crise durante uma solicitação, o coaching será bloqueado e substituído por conteúdo fixo, revisado e apropriado ao Brasil; isso não será apresentado como detecção clínica.

Exportação de conta será gerada e transmitida como JSON na própria requisição, com rate limit e `no-store`. Exclusão de conta exigirá reautenticação recente, revogará sessões e apagará dados pessoais em transação; eventos técnicos indispensáveis serão anonimizados. A política de expiração dos backups deverá ser documentada no deploy. Não serão prometidos jobs assíncronos sem processador implementado.

## 8. Observabilidade, qualidade e deploy

- CI executará lint, testes, build e validação de migrations.
- Backend registrará request ID, latência, status e código de erro.
- Métricas iniciais: taxa de erro, latência p95, conexões MySQL, falhas de login/refresh, falhas de e-mail e Groq.
- Railway hospedará API e MySQL com TLS, backups e variáveis separadas por ambiente.
- Vercel hospedará artefato do Vite com fallback de SPA e variáveis públicas limitadas.
- Migration será etapa controlada de release, não executada concorrentemente por cada instância.
- Ambientes: local, homologação e produção; bases e segredos nunca serão compartilhados.

## 9. Riscos de arquitetura e respostas

| Risco | Impacto | Resposta |
|---|---|---|
| Escopo grande até novembro | Entrega parcial e baixa qualidade | Cortes verticais, critérios de aceite e reserva final |
| Regras emocionais indefinidas | Banco/gráficos inconsistentes | Validar escalas antes da primeira migration |
| Streak e fuso ambíguos | Métricas incorretas | Formalizar exemplos e testes de calendário |
| Dados sensíveis | Risco jurídico e reputacional | LGPD, minimização, consentimento e expurgo |
| IA parecer clínica | Dano ao usuário e ao TCC | Guardrails, avisos, opt-in e revisão de conteúdo |
| Modelo Groq descontinuado | Falha na Fase 7 | Modelo configurável e adaptador desacoplado |
| Cookie cross-site | Sessão instável ou CSRF | Domínio próprio ou proteção cross-site completa |
| Recuperação sem provedor | Funcionalidade incompleta | Escolher provedor e domínio antes da Sprint 2 |
| Dashboard antes das regras | Retrabalho | Finalizar agenda/check-in antes das métricas |
| Repositório sem TCC | Desalinhamento acadêmico | Matriz requisito → tabela → rota → teste após receber o texto |

## 10. Critério de aprovação da arquitetura

Antes da Fase 1 devem ser aprovados:

- regras de frequência, pausa, atraso, edição retroativa e streak;
- campos e referencial do Diário Cognitivo;
- catálogo e escalas emocionais;
- política de exclusão, exportação e retenção;
- ERD e contratos REST;
- domínios/cookies e provedor de e-mail;
- consentimento e limites da IA;
- critérios acadêmicos que demonstrarão o resultado do TCC.

Após essa aprovação, a primeira migration e o contrato OpenAPI poderão ser congelados e a Fase 1 iniciada.
