# Habitus — Roadmap de sprints do MVP

> Planejamento-base: 22/06/2026 a 27/11/2026.  
> Cadência: sprints quinzenais, demonstração e retrospectiva ao fim de cada ciclo.

## Princípios de entrega

- Cada sprint entrega um corte vertical funcional, com migration, API, interface e testes quando aplicável.
- Uma história só termina com critérios de aceite verificados e documentação atualizada.
- Nenhum dashboard será validado antes das regras de agenda/check-in.
- Não haverá dado mockado em ambiente funcional; testes usam banco isolado e fixtures descartáveis.
- Mudança de banco exige migration e atualização de `schema.sql`.

## Cronograma

| Sprint | Período | Objetivo e entregáveis | Gate de saída |
|---|---|---|---|
| 0 | 22/06–03/07 | Consolidar TCC, regras, ERD, arquitetura, API, LGPD, sitemap, matriz de estados, conteúdo de crise/consentimento, métricas e critérios acadêmicos | Arquitetura e regras abertas aprovadas |
| 1 | 06/07–17/07 | Estrutura do monorepo, MySQL, migrations, base Express, erros, logs, health/readiness e CI | Banco reproduzível e API base testada |
| 2 | 20/07–31/07 | Cadastro, login, JWT, refresh rotativo, logout, recuperação e testes de segurança | Fluxos de auth integrados e auditados |
| 3 | 03/08–14/08 | Base React, design system, rotas, Axios, login, cadastro, recuperação, perfil e primeiro acesso | Autenticação ponta a ponta e teste de usabilidade |
| 4 | 17/08–28/08 | CRUD, agenda versionada, arquivamento e registro diário de hábitos | Regras cobertas e teste criação/check-in/arquivo |
| 5 | 31/08–11/09 | Emoções associadas, plano do dia e dashboard inicial | Métricas reconciliadas com registros reais |
| 6 | 14/09–25/09 | Diário Cognitivo, rascunho/autosave, emoções e histórico | Isolamento, prevenção de perda e usabilidade validados |
| 7 | 28/09–09/10 | Check-in espontâneo, telemetria, tendências e distribuições | Séries, compreensão dos gráficos, fuso e acessibilidade validados |
| 8 | 12/10–23/10 | Groq/Llama, consentimento contextual, provider, guardrails, idempotência e histórico | Segurança, confiança e opt-in testados com usuários |
| 9 | 26/10–06/11 | E2E, segurança, acessibilidade, responsividade, desempenho e correções | Zero falha crítica; relatório QA aprovado |
| 10 | 09/11–20/11 | Deploy Vercel/Railway, backups, observabilidade, documentação e ensaio | Release candidate demonstrável |
| Reserva | 23/11–27/11 | Contingência, correções e preparação final da banca | Versão final etiquetada e roteiro validado |

## Fases solicitadas e correspondência

### Aprovação arquitetural — Sprint 0

- Receber/analisar o texto formal do TCC.
- Fechar regras de hábitos, Diário Cognitivo e emoções.
- Aprovar ERD, API, segurança, LGPD, sitemap, fluxos/estados UX, WCAG 2.2 AA e critérios de sucesso.

### Fase 1 — Sprints 1 e 2

- Backend completo na extensão necessária à autenticação.
- Banco, migrations e seed de catálogos aprovados.
- Cadastro, login, refresh, logout e recuperação.

### Fase 2 — Sprint 3

- Frontend de login, cadastro e recuperação.
- Integração real com backend e estados de erro/carregamento.

### Fase 3 — Sprint 4

- CRUD de hábitos, agenda, plano diário e registros.

### Fase 4 — Sprint 5

- Dashboard baseado em dados reais e emoções associadas.

### Fase 5 — Sprint 6

- Diário Cognitivo completo.

### Fase 6 — Sprint 7

- Telemetria emocional e visualizações acessíveis.

### Fase 7 — Sprint 8

- Groq + modelo Llama ativo, configurável e protegido.

### Estabilização — Sprints 9 e 10

- QA, segurança, acessibilidade, deploy, documentação e banca.

## Definition of Done

Uma entrega é considerada concluída quando:

1. Critérios de aceite foram demonstrados.
2. Código segue camadas e convenções aprovadas.
3. Entradas e autorização são validadas no backend.
4. Testes unitários/integrados relevantes passam.
5. Não existem dados mockados no fluxo funcional.
6. Migration e rollback seguro foram revisados quando o banco mudou.
7. Logs não expõem segredos ou conteúdo sensível.
8. Interface possui loading, empty, erro e sucesso, quando aplicável.
9. Acessibilidade e responsividade foram verificadas.
10. OpenAPI e documentação técnica estão atualizados.

Acessibilidade é critério de aceite de toda sprint com interface, não uma correção reservada à Sprint 9.

## Critérios de qualidade antes da banca

- Fluxos críticos E2E: cadastro → login → hábito → check-in → dashboard; diário → emoção → telemetria; recuperação de senha; consentimento → insight.
- Nenhuma vulnerabilidade crítica/alta conhecida em dependências ou testes de aplicação.
- Isolamento entre usuários comprovado por testes de integração.
- Migrations executadas do zero em ambiente limpo e backup/restore ensaiado.
- Comportamento em erro de MySQL, e-mail e Groq demonstrado sem perda de dados.
- Acessibilidade WCAG 2.2 AA verificada por teclado, leitor de tela, zoom/reflow e contraste nos fluxos principais.
- Documentação de instalação, deploy, variáveis, decisões e limitações.

## Bloqueios que precisam de decisão na Sprint 0

1. Disponibilizar o texto formal do TCC e protótipos, se existirem.
2. Aprovar regras de recorrência e streak com exemplos.
3. Aprovar campos do Diário Cognitivo.
4. Aprovar catálogo e escalas emocionais.
5. Definir política LGPD, retenção, exportação e exclusão.
6. Escolher provedor de e-mail e estratégia de domínios/cookies.
7. Definir critérios quantitativos e qualitativos da avaliação acadêmica.
8. Aprovar janela retroativa, dia não agendado, `skipped`, fórmulas e mínimo amostral.
9. Aprovar textos/fluxos de consentimento opcional da IA e recursos de crise.
