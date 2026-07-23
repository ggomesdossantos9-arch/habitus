# Habitus — Catálogo da API REST

> Status: contrato de alto nível v0.1. O OpenAPI executável será escrito após aprovação.  
> Prefixo de negócio: `/api/v1`.

## 1. Convenções

- Autenticação: `Authorization: Bearer <access-token>` nas rotas protegidas.
- Refresh e logout usam cookie seguro e proteção CSRF conforme o ambiente.
- Datas usam ISO 8601; `date` civil usa `YYYY-MM-DD`.
- Criação retorna `201`; leitura/atualização `200`; remoção/logout sem corpo `204`.
- Códigos esperados: `400`, `401`, `403`, `404`, `409`, `422`, `429` e `500`.
- Endpoints de dados pessoais retornam `Cache-Control: no-store`.
- Listas aceitam `cursor` opaco e `limit` (padrão 20, máximo 100), ordenadas por `created_at DESC, public_id DESC` para desempate estável.
- Intervalos analíticos têm limite máximo de 366 dias no MVP.
- Criações de insight e upserts aceitam `Idempotency-Key`; uma chave repetida pelo mesmo usuário devolve o resultado original.

## 2. Sistema

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/health` | Não | Liveness da API |
| GET | `/ready` | Não | Readiness, incluindo MySQL |

## 3. Autenticação

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| POST | `/api/v1/auth/register` | Não | Criar conta e aceites obrigatórios; IA não integra o cadastro |
| POST | `/api/v1/auth/login` | Não | Autenticar e iniciar sessão |
| POST | `/api/v1/auth/refresh` | Cookie/CSRF | Rotacionar refresh e emitir access token |
| POST | `/api/v1/auth/logout` | Refresh cookie + CSRF | Revogar a sessão identificada pelo cookie |
| POST | `/api/v1/auth/logout-all` | Sim | Revogar todas as sessões do usuário |
| POST | `/api/v1/auth/forgot-password` | Não | Solicitar recuperação; resposta sempre genérica |
| POST | `/api/v1/auth/reset-password` | Token único | Definir nova senha e revogar sessões |
| GET | `/api/v1/auth/csrf` | Cookie | Emitir token CSRF se o deploy for cross-site |
| POST | `/api/v1/auth/reauthenticate` | Sim | Validar senha atual e emitir token de reautenticação curto |

## 4. Perfil e consentimentos

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/users/me` | Sim | Consultar perfil atual |
| PATCH | `/api/v1/users/me` | Sim | Alterar nome, fuso e locale |
| PATCH | `/api/v1/users/me/password` | Sim + reauth | Alterar senha e revogar outras sessões |
| DELETE | `/api/v1/users/me` | Sim + reauth | Excluir fisicamente conta e dados pessoais em transação |
| GET | `/api/v1/users/me/consents` | Sim | Listar consentimentos e versões |
| POST | `/api/v1/users/me/consent-events` | Sim | Acrescentar evento imutável de concessão/revogação |
| GET | `/api/v1/users/me/export` | Sim + reauth | Transmitir exportação JSON síncrona |

## 5. Catálogo emocional

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/emotions` | Sim | Listar catálogo ativo de emoções |

## 6. Hábitos e registro diário

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/habits` | Sim | Listar hábitos; filtros `status` e paginação |
| POST | `/api/v1/habits` | Sim | Criar hábito e agenda em transação |
| GET | `/api/v1/habits/:habitId` | Sim | Detalhar hábito próprio |
| PATCH | `/api/v1/habits/:habitId` | Sim | Alterar definição; agenda cria versão; início é imutável e término só muda prospectivamente |
| DELETE | `/api/v1/habits/:habitId` | Sim | Arquivar por padrão |
| POST | `/api/v1/habits/:habitId/restore` | Sim | Restaurar hábito arquivado |
| GET | `/api/v1/habits/:habitId/checkins` | Sim | Listar registros entre `from` e `to` |
| PUT | `/api/v1/habits/:habitId/checkins/:date` | Sim | Criar/atualizar registro idempotente e emoções |
| DELETE | `/api/v1/habits/:habitId/checkins/:date` | Sim | Remover registro diário próprio |
| GET | `/api/v1/daily-plan` | Sim | Agenda e estado dos hábitos em `date` |

O corpo do `PUT checkins` aceita progresso, estado, nota e bloco emocional. A atualização de check-in, evento e itens emocionais ocorre em uma transação.

## 7. Diário Cognitivo

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/cognitive-journal` | Sim | Listar entradas por período e paginação |
| POST | `/api/v1/cognitive-journal` | Sim | Criar rascunho |
| GET | `/api/v1/cognitive-journal/:entryId` | Sim | Consultar entrada própria |
| PATCH | `/api/v1/cognitive-journal/:entryId` | Sim | Atualizar campos e emoção em transação |
| POST | `/api/v1/cognitive-journal/:entryId/complete` | Sim | Validar campos obrigatórios e concluir rascunho |
| DELETE | `/api/v1/cognitive-journal/:entryId` | Sim | Excluir fisicamente entrada e derivados |

## 8. Eventos e telemetria emocional

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/emotional-events` | Sim | Listar por `from`, `to` e `source` |
| POST | `/api/v1/emotional-events` | Sim | Criar check-in emocional espontâneo |
| GET | `/api/v1/emotional-events/:eventId` | Sim | Consultar evento próprio |
| PATCH | `/api/v1/emotional-events/:eventId` | Sim | Atualizar evento e itens emocionais |
| DELETE | `/api/v1/emotional-events/:eventId` | Sim | Excluir evento próprio |
| GET | `/api/v1/telemetry/summary` | Sim | Resumo de intensidade, valência e energia |
| GET | `/api/v1/telemetry/trends` | Sim | Série por dia/semana e fonte |
| GET | `/api/v1/telemetry/distribution` | Sim | Distribuição de emoções no período |
| GET | `/api/v1/telemetry/habit-correlations` | Sim | Associação descritiva entre hábitos e emoções |

“Correlação” será apresentada como associação descritiva, sem inferência causal ou clínica.

## 9. Dashboard

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| GET | `/api/v1/dashboard/summary` | Sim | KPIs do período e plano do dia |
| GET | `/api/v1/dashboard/habits` | Sim | Conclusão e consistência por hábito |
| GET | `/api/v1/dashboard/emotions` | Sim | Resumo emocional contextualizado |
| GET | `/api/v1/dashboard/streaks` | Sim | Sequências calculadas em `asOf` |

Todas as métricas são calculadas no backend a partir de agenda, check-ins e eventos persistidos.

## 10. IA

| Método | Rota | Auth | Finalidade |
|---|---|---:|---|
| POST | `/api/v1/ai/insights` | Sim + consentimento | Gerar insight síncrono por tipo e fonte/período |
| GET | `/api/v1/ai/insights` | Sim | Listar histórico paginado |
| GET | `/api/v1/ai/insights/:insightId` | Sim | Consultar insight próprio |
| DELETE | `/api/v1/ai/insights/:insightId` | Sim | Excluir fisicamente insight |

O endpoint de criação não aceita prompt livre. O backend seleciona dados mínimos, monta prompt versionado, chama o provider e valida a saída estruturada. Retorna `201` concluído, `422` bloqueado por segurança ou `503` em falha transitória; não existe `202`/polling no MVP.

## 11. Matriz de rastreabilidade do MVP

| Requisito | Regra central | Rotas principais | Tabelas | Casos QA |
|---|---|---|---|---|
| Cadastro/Login | e-mail único, bcrypt, access curto, refresh rotativo | `/auth/*` | `users`, `refresh_tokens`, `auth_events` | duplicidade; credencial genérica; rotação/reuso; isolamento |
| Recuperação | resposta genérica, token único/curto, revogar sessões | `/auth/forgot-password`, `/reset-password` | `password_reset_tokens` + provider síncrono | e-mail conhecido/desconhecido; expiração; uso único; revogação |
| Perfil | reauth em ação sensível; fuso não reclassifica passado | `/users/me*` | `users`, `user_consent_events` | reauth válida/expirada; exportação; exclusão; mudança de fuso |
| CRUD hábitos | agenda/meta versionadas; archive/restore | `/habits*` | `habits`, `habit_schedule_versions`, `habit_schedule_weekdays` | tipos de agenda; versão; arquivo/restauração; posse |
| Registro diário | um registro por hábito/data; sem futuro | `/habits/:id/checkins*`, `/daily-plan` | `habit_checkins` | upsert; futuro; data não agendada; concorrência; meta histórica |
| Emoções nos hábitos | transação única e escalas fechadas | `PUT .../checkins/:date` | `emotional_events`, `emotional_event_items` | limites; primária única; rollback; cascade |
| Diário Cognitivo | draft/autosave/complete; exclusão física | `/cognitive-journal*` | `cognitive_journal_entries`, `emotional_events` | autosave; conflito; conclusão inválida; perda de sessão; exclusão |
| Telemetria | fórmulas do modelo; sem causalidade | `/telemetry*`, `/emotional-events*` | `emotional_events`, `emotions` | fuso; denominador; arredondamento; mínimo amostral; vazio |
| Dashboard | projeções reais e regras de streak versionadas | `/dashboard*` | projeções das tabelas anteriores | daily/weekly; skipped; mudança de agenda; reconciliação SQL |
| Groq/Llama | opt-in, fonte mínima, sem prompt livre | `/ai/insights*` | `ai_insights`, `user_consent_events` | opt-in/revogação; idempotência; timeout; crise; fonte e exclusão |

## 12. Contratos essenciais de entrada

O OpenAPI 3.1 será congelado após a aprovação das regras. Estes shapes delimitam a implementação e os testes; campos desconhecidos serão rejeitados.

| Caso | Campos obrigatórios | Regras principais |
|---|---|---|
| Cadastro | `name`, `email`, `password`, versões de termos/privacidade | senha 12+; IA não aceita aqui |
| Login | `email`, `password` | resposta externa genérica para credencial inválida |
| Hábito | `name`, `startDate`, `schedule` | schedule contém tipo, meta e dias coerentes |
| Check-in | `status`, `progressValue`; emoção opcional | data não futura; recurso próprio; bloco emocional completo se presente |
| Diário rascunho | `occurredAt`; demais campos opcionais | autosave retorna `lastSavedAt` |
| Concluir diário | sem corpo ou versão otimista | situação e pensamentos obrigatórios; evita sobrescrita concorrente |
| Evento emocional | `valence`, `energy`, `emotions[]`, `occurredAt` | valência -2..2, energia/intensidade 1..5 |
| Insight | `type` e exatamente uma fonte válida | header `Idempotency-Key`; sem prompt livre; consentimento vigente |
| Consentimento | `type`, `action`, `documentVersion` | IA opcional; eventos append-only |

Exemplo de schedule:

```json
{
  "frequencyType": "specific_weekdays",
  "weekdays": [1, 3, 5],
  "targetValue": 1,
  "unit": null,
  "effectiveFrom": "2026-07-20"
}
```

Exemplo de erro de validação:

```json
{
  "type": "https://api.habitus/errors/validation",
  "title": "Dados inválidos",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "detail": "Revise os campos informados.",
  "requestId": "uuid",
  "errors": [{ "field": "password", "code": "TOO_SHORT" }]
}
```

Erros por regra usam `422`; conflito de e-mail/versão/idempotência incompatível usa `409`; recurso inexistente ou alheio usa `404`; limite usa `429` com `Retry-After`. `ready` nunca expõe credenciais, host ou detalhes do MySQL.

## 13. Regras de autorização

- `sub` do JWT identifica o usuário; o backend resolve o `id` interno.
- Consultas por recurso combinam `public_id` e `user_id` na mesma query.
- O cliente nunca informa `user_id`.
- Consentimento vigente é verificado no service antes da IA.
- Rate limit específico protege cadastro, login, refresh, recuperação e geração de insight.
- Operações sensíveis exigem `X-Reauth-Token` com `type=reauth`, sujeito e `auth_version` válidos.

## 14. Casos de contrato obrigatórios no QA

- Outro usuário nunca lê, altera ou infere existência de recurso por ID.
- Edição de agenda cria versão e não altera métricas anteriores.
- Duas chamadas com a mesma idempotency key não duplicam check-in/insight.
- Refresh concorrente produz somente uma rotação válida; reuso revoga a família.
- Reset consome um token uma vez e invalida os demais.
- Exclusão de check-in/diário remove evento e insight derivados conforme as FKs.
- Revogar IA impede geração imediata; reconceder cria novo evento sem apagar histórico.
- Exportação não inclui hashes, tokens, auditoria interna ou conteúdo de outro usuário.
- Datas próximas à meia-noite respeitam o fuso e não reclassificam histórico após mudança de timezone.
