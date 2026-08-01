import { createHash } from 'node:crypto';
import { Problem } from '../utils/problem.js';
import { now, publicId, toPublicInsight } from '../utils/domain.js';

const PROMPT_VERSION = 'habitus-ai-v1';
const analysisSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['resumo', 'padroesEmocionais', 'pensamentosRecorrentes', 'sugestoes', 'safetyLevel'],
  properties: {
    resumo: { type: 'string' },
    padroesEmocionais: { type: 'array', items: { type: 'string' } },
    pensamentosRecorrentes: { type: 'array', items: { type: 'string' } },
    sugestoes: { type: 'array', items: { type: 'string' } },
    safetyLevel: { type: 'string', enum: ['normal', 'sensitive', 'crisis'] },
  },
};

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const asArray = (value) => Array.isArray(value) ? value.filter((item) => typeof item === 'string').slice(0, 8) : [];
function normalizeAnalysis(value) {
  if (!value || typeof value !== 'object') throw new Problem(503, 'AI_PROVIDER_INVALID_JSON', 'A IA retornou uma resposta invalida.');
  return {
    resumo: typeof value.resumo === 'string' && value.resumo.trim() ? value.resumo.trim() : 'Analise gerada sem resumo textual.',
    padroesEmocionais: asArray(value.padroesEmocionais),
    pensamentosRecorrentes: asArray(value.pensamentosRecorrentes),
    sugestoes: asArray(value.sugestoes),
    safetyLevel: ['normal', 'sensitive', 'crisis'].includes(value.safetyLevel) ? value.safetyLevel : 'normal',
  };
}

export class AiService {
  constructor({ db, env, userService, journalService, habitService }) {
    Object.assign(this, { db, env, userService, journalService, habitService });
  }

  async callGroq(sourceText, context) {
    if (!this.env.GROQ_API_KEY) throw new Problem(503, 'AI_PROVIDER_UNCONFIGURED', 'Configure GROQ_API_KEY para usar IA.');
    let response;
    try {
      response = await fetch(`${this.env.GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.env.GROQ_MODEL,
          temperature: 0.2,
          max_completion_tokens: 900,
          reasoning_effort: 'low',
          messages: [
            {
              role: 'system',
              content: 'Voce analisa diarios cognitivos e dados de habitos em pt-BR. Nao faca diagnosticos clinicos. Responda somente JSON conforme o schema.',
            },
            {
              role: 'user',
              content: `Contexto: ${context}\n\nDados do usuario:\n${sourceText}`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'habitus_analysis', strict: true, schema: analysisSchema },
          },
        }),
      });
    } catch {
      throw new Problem(503, 'AI_PROVIDER_UNAVAILABLE', 'Servico de IA temporariamente indisponivel.');
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const code = response.status === 429 ? 'AI_RATE_LIMITED' : 'AI_PROVIDER_FAILED';
      const detail = response.status === 429 ? 'Limite de requisicoes da IA atingido. Tente novamente mais tarde.' : payload?.error?.message ?? 'Falha temporaria ao chamar a IA.';
      throw new Problem(response.status === 429 ? 429 : 503, code, detail);
    }
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Problem(503, 'AI_PROVIDER_EMPTY', 'A IA nao retornou conteudo.');
    try {
      return { content: normalizeAnalysis(JSON.parse(content)), usage: payload.usage ?? {} };
    } catch (error) {
      if (error instanceof Problem) throw error;
      throw new Problem(503, 'AI_PROVIDER_INVALID_JSON', 'A IA retornou uma resposta invalida.');
    }
  }

  async buildSource(user, input) {
    if (input.type === 'journal_reflection') {
      const { entry, text } = await this.journalService.textForAi(user, input.journalEntryId);
      return { text, source: { cognitive_journal_entry_id: entry.id }, context: 'Analise uma entrada do diario cognitivo.' };
    }
    if (input.type === 'habit_coaching') {
      const habit = await this.habitService.getHabit(user, input.habitId);
      const publicHabit = await this.habitService.serializeHabit(habit);
      const text = JSON.stringify(publicHabit, null, 2);
      return { text, source: { habit_id: habit.id }, context: 'Analise um habito e gere sugestoes praticas.' };
    }
    const rows = await this.db('emotional_events')
      .select('local_date', 'valence', 'energy', 'source_type', 'note')
      .where({ user_id: user.id })
      .whereBetween('local_date', [input.periodStart, input.periodEnd])
      .orderBy('local_date', 'asc');
    return {
      text: JSON.stringify(rows, null, 2),
      source: { period_start: input.periodStart, period_end: input.periodEnd },
      context: 'Analise um periodo de telemetria emocional.',
    };
  }

  async create(user, input, idempotencyKey) {
    if (!(await this.userService.hasActiveConsent(user, 'ai_processing'))) {
      throw new Problem(422, 'AI_CONSENT_REQUIRED', 'Conceda consentimento de processamento por IA antes de gerar analises.');
    }
    const { text, source, context } = await this.buildSource(user, input);
    const key = idempotencyKey ?? sha256(`${user.id}:${input.type}:${JSON.stringify(source)}`).slice(0, 64);
    const existing = await this.db('ai_insights').where({ user_id: user.id, idempotency_key: key }).first();
    if (existing) return toPublicInsight(existing);

    const inputHash = sha256(`${context}\n${text}`);
    const started = Date.now();
    const result = await this.callGroq(text, context);
    const createdAt = now();
    const [id] = await this.db('ai_insights').insert({
      public_id: publicId(),
      user_id: user.id,
      insight_type: input.type,
      habit_id: source.habit_id ?? null,
      cognitive_journal_entry_id: source.cognitive_journal_entry_id ?? null,
      period_start: source.period_start ?? null,
      period_end: source.period_end ?? null,
      status: 'completed',
      provider: 'groq',
      model_id: this.env.GROQ_MODEL,
      prompt_version: PROMPT_VERSION,
      content_json: JSON.stringify(result.content),
      safety_level: result.content.safetyLevel,
      input_hash: inputHash,
      idempotency_key: key,
      prompt_tokens: result.usage.prompt_tokens ?? result.usage.input_tokens ?? null,
      completion_tokens: result.usage.completion_tokens ?? result.usage.output_tokens ?? null,
      latency_ms: Date.now() - started,
      created_at: createdAt,
      updated_at: createdAt,
      completed_at: createdAt,
    });

    if (input.type === 'journal_reflection') {
      await this.journalService.attachAiAnalysis(user, input.journalEntryId, result.content);
    }
    return toPublicInsight(await this.db('ai_insights').where({ id }).first());
  }

  async list(user, query = {}) {
    const rows = await this.db('ai_insights')
      .where({ user_id: user.id })
      .orderBy('created_at', 'desc')
      .limit(query.limit ?? 100);
    return rows.map(toPublicInsight);
  }

  async detail(user, insightId) {
    const row = await this.db('ai_insights').where({ public_id: insightId, user_id: user.id }).first();
    if (!row) throw new Problem(404, 'AI_INSIGHT_NOT_FOUND', 'Analise de IA nao encontrada.');
    return toPublicInsight(row);
  }

  async delete(user, insightId) {
    const deleted = await this.db('ai_insights').where({ public_id: insightId, user_id: user.id }).del();
    if (!deleted) throw new Problem(404, 'AI_INSIGHT_NOT_FOUND', 'Analise de IA nao encontrada.');
  }
}
