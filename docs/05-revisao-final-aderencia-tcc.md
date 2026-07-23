# Habitus — Revisão final de aderência ao TCC

> Data da auditoria: 22/06/2026  
> Status: auditoria preliminar concluída; validação oficial bloqueada pela ausência do documento-fonte  
> Revisores: Product Manager & Software Architect, Backend/Database/AI Engineer e QA Tester

> **Atualização posterior:** o responsável pelo TCC declarou o escopo oficial validado e autorizou expressamente a Fase 1. O gate fechado registrado neste relatório é histórico e foi substituído por essa decisão.

## 1. Parecer executivo

Além deste relatório, o workspace contém somente os quatro documentos arquiteturais produzidos anteriormente. Não existe PDF, DOCX, Markdown ou outro arquivo com o documento oficial do TCC Habitus.

Consequentemente:

- **Aderência ao briefing fornecido na conversa:** 100% de representação arquitetural nominal — 11 de 11 capacidades, considerando as dez funções do MVP e a integração com IA.
- **Aderência ao documento oficial do TCC:** **não mensurável**.
- **Condição “aderência acima de 95%”:** não comprovada.
- **Autorização para iniciar a Fase 1:** não acionada.

O percentual de 100% acima significa apenas que todas as capacidades resumidas possuem representação de alto nível em arquitetura, banco e API. Não significa que tenham sido implementadas, nem substitui a comparação com os requisitos formais do TCC.

## 2. Método de avaliação oficial

Quando o TCC for disponibilizado, cada requisito atômico funcional e não funcional será pontuado:

- `1,0`: integralmente representado em arquitetura, dados, API e estratégia de teste.
- `0,5`: parcialmente representado ou dependente de premissa não confirmada.
- `0,0`: ausente ou incompatível.

```text
aderência = soma das pontuações / total de requisitos atômicos × 100
```

Além do percentual, haverá um gate de ambiguidade bloqueante: mesmo acima de 95%, a implementação não começa se uma pendência puder alterar o modelo de dados, os contratos REST, a segurança ou os critérios acadêmicos.

## 3. Cobertura funcional contra o briefing disponível

| Capacidade | Banco/derivação | API | Situação arquitetural |
|---|---|---|---|
| Cadastro | `users`, `user_consent_events`, `auth_events` | `POST /auth/register` | Coberta |
| Login | `users`, `refresh_tokens`, `auth_events` | login, refresh, logout e logout global | Coberta |
| Recuperação de senha | `password_reset_tokens` | forgot/reset password | Coberta; provedor pendente |
| Perfil | `users`, consentimentos | `/users/me`, senha, exportação e exclusão | Coberta; campos oficiais pendentes |
| CRUD de hábitos | `habits`, versões e dias de agenda | listar, criar, detalhar, alterar, arquivar e restaurar | Coberta; semântica de excluir pendente |
| Registro diário | `habit_checkins` | check-ins e plano diário | Coberta; retroatividade pendente |
| Emoções associadas | `emotions`, `emotional_events`, itens | bloco emocional em check-in e diário | Coberta; catálogo oficial pendente |
| Dashboard | projeções de agendas, check-ins e emoções | summary, habits, emotions e streaks | Coberta; indicadores oficiais pendentes |
| Diário Cognitivo | `cognitive_journal_entries` e eventos | draft, autosave, complete, histórico e exclusão | Coberta; método/campos oficiais pendentes |
| Telemetria Emocional | eventos, itens e catálogo | summary, trends, distribution e associações | Coberta; escalas/fórmulas oficiais pendentes |
| Groq/Llama 3 | `ai_insights` e consentimento | criar, listar, consultar e excluir insights | Coberta; modelo/política pendentes |

Não foi identificada, no briefing disponível, uma funcionalidade do MVP totalmente ausente da arquitetura.

## 4. Validação por domínio

### Hábitos

O modelo representa identidade, período, arquivamento, agenda versionada, dias específicos, meta semanal, meta quantitativa e check-ins. O versionamento evita que mudanças futuras alterem dashboard e streak históricos.

Pendências:

- pausa temporária e retomada;
- intervalos, recorrência mensal ou outras frequências, caso previstas no TCC;
- edição retroativa e registro em dia não agendado;
- semântica exata de `skipped`;
- confirmar se “excluir” no CRUD pode significar arquivar;
- esclarecer `weekly_target` versus `target_value`.

Risco de integridade: `habit_checkins(habit_id, schedule_version_id)` deve garantir que a versão pertence ao mesmo hábito, preferencialmente com chave/FK composta no DDL.

### Registro de emoções

O catálogo, evento central, itens N:N, intensidade inicial/final, valência e energia permitem emoções espontâneas ou vinculadas ao hábito/diário.

Pendências:

- vocabulário oficial das emoções;
- obrigatoriedade de emoção no check-in;
- escalas e textos de apoio validados academicamente;
- garantir no banco que origem, evento e usuário pertencem ao mesmo tenant;
- garantir uma única emoção primária mesmo sob concorrência.

### Dashboard

Não há tabela duplicada de métricas; o backend calcula projeções a partir dos fatos, abordagem adequada ao MVP. Existem rotas para resumo, hábitos, emoções e sequências.

Pendências:

- KPIs e gráficos exatos prometidos no TCC;
- filtros, períodos e comparações;
- regras finais de streak e denominadores;
- mínimo amostral e apresentação de dados insuficientes;
- metas mensuráveis de desempenho das consultas.

### Diário Cognitivo

O modelo cobre situação, pensamentos, evidências, alternativa, resposta, resultado, emoções, rascunho e conclusão.

Pendências:

- confirmar o instrumento/referencial oficial e seus campos;
- validar distorções cognitivas, intensidade antes/depois e possibilidade de reabrir;
- adicionar `lock_version` ou contrato `ETag/If-Match` para impedir que autosaves concorrentes sobrescrevam texto;
- definir retenção e exclusão de conteúdo sensível.

### Telemetria Emocional

Eventos normalizados suportam séries, distribuição e associação descritiva com hábitos. A arquitetura evita afirmar causalidade ou diagnóstico.

Pendências:

- indicadores exigidos pelo TCC;
- fórmula, arredondamento e limiar amostral definitivos;
- tratamento de dias sem registro;
- relatórios ou exportações acadêmicas, se prometidos.

### Integração com IA

Existe provider desacoplado, modelo configurável, consentimento opcional, minimização de dados, idempotência, histórico e guardrails.

Pendências:

- confirmar o modelo Groq/Llama ativo e sua política de retenção;
- definir critérios acadêmicos de qualidade das respostas;
- decidir se um snapshot minimizado dos dados-fonte é necessário para reprodutibilidade, equilibrando LGPD;
- fechar conteúdo e protocolo não clínico para situações de crise;
- validar se chamada síncrona atende aos requisitos de latência/disponibilidade.

## 5. Cobertura da API

Todas as capacidades do briefing possuem rotas de alto nível. O catálogo ainda não é um OpenAPI congelado e mantém decisões abertas:

- comportamento do bloco emocional omitido/nulo no upsert de check-in;
- controle de concorrência do autosave;
- campos mutáveis de eventos ligados a check-in/diário;
- restauração de hábito já encerrado;
- query params, respostas e fórmulas finais do dashboard/telemetria;
- versão vigente de termos e privacidade deve vir de configuração/tabela autoritativa do backend, nunca ser confiada ao cliente;
- persistência e resposta HTTP de insights `failed`/`blocked`;
- edição de e-mail e demais campos oficiais do perfil;
- exclusão definitiva individual de hábito, se exigida.

O OpenAPI só deve ser congelado depois da matriz oficial de requisitos.

## 6. Possíveis simplificações excessivas

São cortes razoáveis para um MVP, mas podem gerar desconto se o TCC oficial prometer comportamento diferente:

1. Um único papel de usuário, sem administrador.
2. Recorrência limitada a diária, dias específicos e meta semanal.
3. Ausência de pausa de hábito, lembretes e notificações.
4. Ausência de verificação de e-mail e avatar.
5. Diário Cognitivo baseado em campos presumidos, sem validação do instrumento acadêmico.
6. Telemetria com escalas e fórmulas propostas, ainda não extraídas do TCC.
7. Associação hábitos–emoções somente descritiva.
8. IA, exportação e exclusão de conta síncronas.
9. Arquivamento usado como operação de remoção do hábito.
10. Dashboard calculado sob demanda sem metas de desempenho formalizadas.

## 7. Funcionalidades adicionais não comprovadas no escopo original

| Item | Classificação recomendada |
|---|---|
| Refresh rotativo, reautenticação, logout global, CSRF e auditoria | Suporte de segurança |
| Consentimentos append-only, exportação e exclusão LGPD | Suporte legal/privacidade |
| Agenda versionada | Integridade histórica |
| Arquivar/restaurar hábitos | Segurança contra perda acidental |
| Check-in emocional espontâneo | Extensão da telemetria; validar escopo |
| Rascunho/autosave do diário | Proteção de UX e conteúdo |
| Histórico, idempotência e guardrails de IA | Segurança/confiabilidade |
| Timezone e locale | Consistência temporal e localização |
| Metas quantitativas e semanais | Extensão funcional; validar escopo |
| Health/readiness | Operação em produção |
| WCAG 2.2 AA | Qualidade e acessibilidade |

Esses itens não devem ser apresentados como funcionalidades originais do TCC sem confirmação. Devem ser justificados como requisitos de suporte ou removidos se ameaçarem o prazo.

## 8. Checklist de aderência

Legenda: `[x]` representado; `[~]` representado por premissa; `[ ]` não validado.

### Funcionais

- [x] Cadastro.
- [x] Login, renovação e logout.
- [x] Recuperação de senha.
- [~] Perfil — campos oficiais ainda desconhecidos.
- [~] CRUD de hábitos — regras de exclusão/pausa/recorrência pendentes.
- [~] Registro diário — retroatividade, dia não agendado e `skipped` pendentes.
- [~] Emoções associadas — catálogo e escalas pendentes.
- [~] Dashboard — KPIs e gráficos oficiais pendentes.
- [~] Diário Cognitivo — método e campos oficiais pendentes.
- [~] Telemetria Emocional — indicadores acadêmicos pendentes.
- [~] Groq/Llama — modelo e critérios de qualidade pendentes.

### Não funcionais e tecnológicos

- [x] React, Vite, Tailwind, React Router e Axios previstos.
- [x] Node.js, Express, JWT e bcrypt previstos.
- [x] MySQL como fonte única da verdade.
- [x] Estrutura obrigatória de diretórios planejada.
- [x] Vercel para frontend e Railway para backend/banco.
- [x] Migrations e `schema.sql` planejados para toda alteração.
- [x] Clean Code, camadas, validação e SQL parametrizado.
- [x] Ausência de mocks em fluxos funcionais.
- [x] Segurança de sessão, CORS, CSRF, rate limit e logs mínimos planejados.
- [x] Revisão QA e UX incorporada à Definition of Done.
- [~] LGPD — política formal e retenção pendentes.
- [~] Acessibilidade — WCAG 2.2 AA planejada, critérios do TCC desconhecidos.
- [ ] Metas formais de latência, capacidade e disponibilidade.
- [ ] RPO, RTO e ensaio de backup/restore.
- [ ] Matriz oficial de navegadores/dispositivos.
- [ ] Cobertura mínima de testes.
- [ ] Critérios acadêmicos de avaliação e aceitação.

### Evidências necessárias para aprovação

- [ ] Documento oficial do TCC anexado ao workspace.
- [ ] Versão/data do documento registrada.
- [ ] RFs e RNFs extraídos e numerados.
- [ ] Matriz requisito → arquitetura → tabela → rota → teste.
- [ ] Percentual oficial calculado pelo método desta auditoria.
- [ ] Nenhuma ambiguidade bloqueante de banco/API.
- [ ] ERD e OpenAPI congelados após aprovação.

## 9. Riscos técnicos

| Severidade | Risco | Impacto | Tratamento |
|---|---|---|---|
| Crítica | Documento oficial ausente | Implementar produto diferente do prometido à banca | Anexar e rastrear o TCC antes do DDL |
| Alta | Agenda/streak/tempo ambíguos | Métricas historicamente incorretas | Fechar exemplos e testes de calendário |
| Alta | Conteúdo emocional sensível | Risco LGPD e reputacional | Minimização, consentimento, retenção e expurgo |
| Alta | Autosaves concorrentes | Perda silenciosa do diário | `lock_version`/ETag e teste concorrente |
| Alta | Integridade cruzada dependente do service | Associação entre tenants/recursos incorretos | FKs compostas, checks, locks e transações |
| Alta | Cookies Vercel/Railway | Sessão instável ou CSRF | Domínio próprio ou proteção cross-site completa |
| Alta | Modelo/saída Groq variáveis | Falha, custo ou conteúdo inadequado | Adapter, allowlist, schema, timeout e guardrails |
| Média | Dashboard sob demanda | Latência com crescimento de dados | Índices, limites, EXPLAIN e teste de carga |
| Média | E-mail síncrono | Timeout e recuperação indisponível | Provider com timeout, observabilidade e estratégia de retry |
| Média | Exclusão física transacional | Locks e falhas parciais | Ordem explícita, testes e política de backup |
| Média | Prazo até novembro | Redução de qualidade ou escopo incompleto | Sprints verticais e gates objetivos |
| Média | Gráficos emocionais | Má interpretação/causalidade indevida | Dados insuficientes, texto acessível e linguagem descritiva |

## 10. Pendências antes da implementação

### Bloqueantes

1. Adicionar o documento oficial do TCC ao workspace.
2. Extrair e numerar todos os RFs, RNFs e critérios de aceite.
3. Validar personas, papéis, menores e campos do perfil.
4. Fechar recorrência, pausa, streak, `skipped`, retroatividade e dia não agendado.
5. Confirmar método e campos do Diário Cognitivo.
6. Confirmar catálogo, escalas e métricas emocionais.
7. Definir KPIs, gráficos e critérios acadêmicos de avaliação.
8. Aprovar política LGPD, retenção, backups, exportação e exclusão.
9. Escolher provedor de e-mail e estratégia de domínio/cookies.
10. Confirmar escopo e critérios da IA.

### Antes do DDL/OpenAPI

1. Projetar FK composta entre check-in, hábito e versão de agenda.
2. Reforçar ownership cruzado dos eventos emocionais.
3. Garantir emoção primária única sob concorrência.
4. Implementar invariante de intervalos de agenda sem sobreposição.
5. Adicionar `lock_version` ao Diário e definir `ETag/If-Match`.
6. Tornar o backend autoridade das versões vigentes de documentos legais.
7. Fechar semântica de `weekly_target`, `target_value` e archive/delete.
8. Definir contratos completos de request/response e erros no OpenAPI.

### RNFs mensuráveis

1. Definir latência p95 e capacidade esperada.
2. Definir disponibilidade, RPO e RTO.
3. Definir política e teste de backup/restore.
4. Definir navegadores, breakpoints e dispositivos suportados.
5. Definir cobertura mínima e gates de CI.
6. Definir retenção de tokens, auditoria e backups.

## 11. Decisão sobre a Fase 1

**Gate fechado.** A Fase 1 não foi iniciada porque a aderência oficial não pôde ser calculada. A condição de autorização exige valor superior a 95%, e “não mensurável” não satisfaz essa condição.

Próxima ação necessária: adicionar o TCC oficial em PDF, DOCX ou Markdown ao repositório e informar o caminho. A auditoria será então reexecutada sobre a fonte formal, sem iniciar código até que o percentual e os bloqueadores sejam resolvidos.
