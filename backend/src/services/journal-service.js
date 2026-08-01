import { Problem } from '../utils/problem.js';
import { dateOnly, now, parseJson, publicId, toPublicJournal } from '../utils/domain.js';

export class JournalService {
  constructor({ db, emotionService }) {
    this.db = db;
    this.emotionService = emotionService;
  }

  async getEntry(user, entryId, q = this.db) {
    const entry = await q('cognitive_journal_entries').where({ public_id: entryId, user_id: user.id }).first();
    if (!entry) throw new Problem(404, 'JOURNAL_ENTRY_NOT_FOUND', 'Entrada de diario nao encontrada.');
    return entry;
  }

  async serialize(entry, q = this.db) {
    const event = await q('emotional_events').where({ cognitive_journal_entry_id: entry.id }).first();
    const emotion = event ? await this.emotionService.serialize(event, q) : null;
    return toPublicJournal(entry, emotion);
  }

  payloadFrom(input, base = {}) {
    const payload = {};
    for (const [source, target] of [
      ['title', 'title'],
      ['text', 'body'],
      ['mood', 'mood'],
      ['status', 'status'],
      ['situation', 'situation'],
      ['automaticThoughts', 'automatic_thoughts'],
      ['evidenceFor', 'evidence_for'],
      ['evidenceAgainst', 'evidence_against'],
      ['alternativeThought', 'alternative_thought'],
      ['behavioralResponse', 'behavioral_response'],
      ['outcome', 'outcome'],
    ]) {
      if (input[source] !== undefined) payload[target] = input[source];
    }
    if (input.occurredAt !== undefined) payload.occurred_at = new Date(input.occurredAt);
    if (!payload.situation && payload.body !== undefined) payload.situation = payload.body;
    return { ...base, ...payload };
  }

  async upsertEmotion(trx, user, entry, input) {
    if (input === undefined) return null;
    const current = await trx('emotional_events').where({ cognitive_journal_entry_id: entry.id, user_id: user.id }).first();
    if (input === null) {
      if (current) {
        await trx('emotional_event_items').where({ event_id: current.id }).del();
        await trx('emotional_events').where({ id: current.id }).del();
      }
      return null;
    }
    const occurredAt = entry.occurred_at ?? now();
    const payload = {
      user_id: user.id,
      source_type: 'cognitive_journal',
      habit_checkin_id: null,
      cognitive_journal_entry_id: entry.id,
      valence: input.valence,
      energy: input.energy,
      note: input.note,
      occurred_at: occurredAt,
      local_date: dateOnly(occurredAt),
      updated_at: now(),
    };
    let eventId = current?.id;
    if (current) {
      await trx('emotional_events').where({ id: current.id }).update(payload);
      await trx('emotional_event_items').where({ event_id: current.id }).del();
    } else {
      const [id] = await trx('emotional_events').insert({ public_id: publicId(), created_at: now(), ...payload });
      eventId = id;
    }
    await this.emotionService.insertItems(trx, eventId, input.emotions);
    return trx('emotional_events').where({ id: eventId }).first();
  }

  async list(user, query = {}) {
    const rows = await this.db('cognitive_journal_entries')
      .where({ user_id: user.id })
      .modify((builder) => {
        if (query.from) builder.where('occurred_at', '>=', `${query.from} 00:00:00`);
        if (query.to) builder.where('occurred_at', '<=', `${query.to} 23:59:59`);
        if (query.status) builder.where({ status: query.status });
      })
      .orderBy('occurred_at', 'desc')
      .limit(query.limit ?? 100);
    return Promise.all(rows.map((row) => this.serialize(row)));
  }

  async create(user, input) {
    return this.db.transaction(async (trx) => {
      const createdAt = now();
      const occurredAt = input.occurredAt ? new Date(input.occurredAt) : createdAt;
      const [id] = await trx('cognitive_journal_entries').insert(this.payloadFrom(input, {
        public_id: publicId(),
        user_id: user.id,
        occurred_at: occurredAt,
        status: input.status,
        last_saved_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
      }));
      const entry = await trx('cognitive_journal_entries').where({ id }).first();
      await this.upsertEmotion(trx, user, entry, input.emotion);
      return this.serialize(entry, trx);
    });
  }

  async detail(user, entryId) {
    return this.serialize(await this.getEntry(user, entryId));
  }

  async update(user, entryId, input) {
    return this.db.transaction(async (trx) => {
      const entry = await this.getEntry(user, entryId, trx);
      const changes = this.payloadFrom(input, { last_saved_at: now(), updated_at: now() });
      await trx('cognitive_journal_entries').where({ id: entry.id }).increment('lock_version', 1).update(changes);
      const updated = await trx('cognitive_journal_entries').where({ id: entry.id }).first();
      await this.upsertEmotion(trx, user, updated, input.emotion);
      return this.serialize(updated, trx);
    });
  }

  async complete(user, entryId) {
    const entry = await this.getEntry(user, entryId);
    if (!(entry.situation || entry.body) || !entry.automatic_thoughts) {
      throw new Problem(422, 'JOURNAL_INCOMPLETE', 'Informe situacao/texto e pensamentos automaticos para concluir.');
    }
    await this.db('cognitive_journal_entries').where({ id: entry.id }).update({ status: 'completed', last_saved_at: now(), updated_at: now() });
    return this.detail(user, entryId);
  }

  async delete(user, entryId) {
    await this.db.transaction(async (trx) => {
      const entry = await this.getEntry(user, entryId, trx);
      const event = await trx('emotional_events').where({ cognitive_journal_entry_id: entry.id }).first();
      await trx('ai_insights').where({ cognitive_journal_entry_id: entry.id, user_id: user.id }).del();
      if (event) await trx('emotional_event_items').where({ event_id: event.id }).del();
      await trx('emotional_events').where({ cognitive_journal_entry_id: entry.id }).del();
      await trx('cognitive_journal_entries').where({ id: entry.id }).del();
    });
  }

  async attachAiAnalysis(user, entryId, analysis, q = this.db) {
    const entry = await this.getEntry(user, entryId, q);
    await q('cognitive_journal_entries').where({ id: entry.id }).update({
      ai_analysis: JSON.stringify(analysis),
      updated_at: now(),
    });
    return { ...entry, ai_analysis: JSON.stringify(analysis) };
  }

  async textForAi(user, entryId) {
    const entry = await this.getEntry(user, entryId);
    return {
      entry,
      text: [
        entry.title && `Titulo: ${entry.title}`,
        entry.mood && `Humor: ${entry.mood}`,
        (entry.body || entry.situation) && `Texto: ${entry.body || entry.situation}`,
        entry.automatic_thoughts && `Pensamentos: ${entry.automatic_thoughts}`,
        entry.evidence_for && `Evidencias a favor: ${entry.evidence_for}`,
        entry.evidence_against && `Evidencias contra: ${entry.evidence_against}`,
        entry.alternative_thought && `Pensamento alternativo: ${entry.alternative_thought}`,
        entry.outcome && `Resultado: ${entry.outcome}`,
        parseJson(entry.ai_analysis) && `Analise anterior: ${JSON.stringify(parseJson(entry.ai_analysis))}`,
      ].filter(Boolean).join('\n'),
    };
  }
}
