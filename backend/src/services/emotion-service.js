import { Problem } from '../utils/problem.js';
import { dateOnly, now, publicId, toPublicEmotion, toPublicEmotionalEvent, todayDate } from '../utils/domain.js';

export class EmotionService {
  constructor({ db }) {
    this.db = db;
  }

  async listCatalog() {
    const rows = await this.db('emotions').where({ is_active: true }).orderBy('display_order', 'asc');
    return rows.map(toPublicEmotion);
  }

  normalizeItems(items) {
    const normalized = items?.length ? items : [{ code: 'outra', intensity: 3, isPrimary: true }];
    const primaryIndex = normalized.findIndex((item) => item.isPrimary);
    return normalized.map((item, index) => ({ ...item, isPrimary: primaryIndex >= 0 ? index === primaryIndex : index === 0 }));
  }

  async insertItems(q, eventId, items) {
    const normalized = this.normalizeItems(items);
    const rows = await q('emotions').whereIn('code', normalized.map((item) => item.code).concat('outra'));
    const byCode = Object.fromEntries(rows.map((row) => [row.code, row]));
    const fallback = byCode.outra ?? rows[0];
    if (!fallback) throw new Problem(422, 'EMOTION_CATALOG_EMPTY', 'Catalogo emocional nao configurado.');
    await q('emotional_event_items').insert(normalized.map((item) => ({
      event_id: eventId,
      emotion_id: byCode[item.code]?.id ?? fallback.id,
      intensity: item.intensity ?? 3,
      resulting_intensity: item.resultingIntensity ?? null,
      is_primary: item.isPrimary,
    })));
  }

  async eventItems(eventId, q = this.db) {
    return q('emotional_event_items')
      .select('emotional_event_items.*', 'emotions.code', 'emotions.name')
      .join('emotions', 'emotions.id', 'emotional_event_items.emotion_id')
      .where({ event_id: eventId })
      .orderBy('is_primary', 'desc')
      .orderBy('emotions.display_order', 'asc');
  }

  async serialize(event, q = this.db) {
    const enriched = await q('emotional_events')
      .select('emotional_events.*', 'habit_checkins.public_id as habit_checkin_public_id', 'cognitive_journal_entries.public_id as journal_public_id')
      .leftJoin('habit_checkins', 'habit_checkins.id', 'emotional_events.habit_checkin_id')
      .leftJoin('cognitive_journal_entries', 'cognitive_journal_entries.id', 'emotional_events.cognitive_journal_entry_id')
      .where({ 'emotional_events.id': event.id })
      .first();
    return toPublicEmotionalEvent(enriched, await this.eventItems(event.id, q));
  }

  async getEvent(user, eventId, q = this.db) {
    const event = await q('emotional_events').where({ public_id: eventId, user_id: user.id }).first();
    if (!event) throw new Problem(404, 'EMOTIONAL_EVENT_NOT_FOUND', 'Evento emocional nao encontrado.');
    return event;
  }

  async listEvents(user, query = {}) {
    const rows = await this.db('emotional_events')
      .where({ user_id: user.id })
      .modify((builder) => {
        if (query.source) builder.where({ source_type: query.source });
        if (query.from) builder.where('local_date', '>=', query.from);
        if (query.to) builder.where('local_date', '<=', query.to);
      })
      .orderBy('occurred_at', 'desc')
      .limit(query.limit ?? 100);
    return Promise.all(rows.map((row) => this.serialize(row)));
  }

  async createStandalone(user, input) {
    return this.db.transaction(async (trx) => {
      const createdAt = now();
      const occurredAt = input.occurredAt ? new Date(input.occurredAt) : createdAt;
      const [id] = await trx('emotional_events').insert({
        public_id: publicId(),
        user_id: user.id,
        source_type: 'standalone',
        habit_checkin_id: null,
        cognitive_journal_entry_id: null,
        valence: input.valence,
        energy: input.energy,
        note: input.note,
        occurred_at: occurredAt,
        local_date: input.localDate ?? dateOnly(occurredAt) ?? todayDate(),
        created_at: createdAt,
        updated_at: createdAt,
      });
      await this.insertItems(trx, id, input.emotions);
      return this.serialize(await trx('emotional_events').where({ id }).first(), trx);
    });
  }

  async detail(user, eventId) {
    return this.serialize(await this.getEvent(user, eventId));
  }

  async update(user, eventId, input) {
    return this.db.transaction(async (trx) => {
      const event = await this.getEvent(user, eventId, trx);
      await trx('emotional_events').where({ id: event.id }).update({
        valence: input.valence,
        energy: input.energy,
        note: input.note,
        occurred_at: input.occurredAt ? new Date(input.occurredAt) : event.occurred_at,
        local_date: input.localDate ?? event.local_date,
        updated_at: now(),
      });
      await trx('emotional_event_items').where({ event_id: event.id }).del();
      await this.insertItems(trx, event.id, input.emotions);
      return this.serialize(await trx('emotional_events').where({ id: event.id }).first(), trx);
    });
  }

  async delete(user, eventId) {
    await this.db.transaction(async (trx) => {
      const event = await this.getEvent(user, eventId, trx);
      await trx('emotional_event_items').where({ event_id: event.id }).del();
      await trx('emotional_events').where({ id: event.id }).del();
    });
  }

  async mostFrequent(user, from, to) {
    const row = await this.db('emotional_event_items')
      .select('emotions.code', 'emotions.name')
      .count('* as total')
      .join('emotions', 'emotions.id', 'emotional_event_items.emotion_id')
      .join('emotional_events', 'emotional_events.id', 'emotional_event_items.event_id')
      .where({ 'emotional_events.user_id': user.id })
      .whereBetween('emotional_events.local_date', [from, to])
      .groupBy('emotions.code', 'emotions.name')
      .orderBy('total', 'desc')
      .first();
    return row ? { code: row.code, name: row.name, total: Number(row.total) } : null;
  }
}
