import { Problem } from '../utils/problem.js';
import { dateOnly, groupBy, now, publicId, toPublicCheckin, toPublicEmotionalEvent, toPublicHabit, todayDate } from '../utils/domain.js';

const dayBefore = (date) => dateOnly(new Date(new Date(`${date}T00:00:00Z`).getTime() - 86400000));
const weekdayOf = (date) => ((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7) + 1;

export class HabitService {
  constructor({ db }) {
    this.db = db;
  }

  async getHabit(user, habitId, q = this.db) {
    const habit = await q('habits').where({ public_id: habitId, user_id: user.id }).first();
    if (!habit) throw new Problem(404, 'HABIT_NOT_FOUND', 'Habito nao encontrado.');
    return habit;
  }

  async latestSchedule(habit, q = this.db) {
    return q('habit_schedule_versions')
      .where({ habit_id: habit.id, user_id: habit.user_id })
      .orderBy('effective_from', 'desc')
      .orderBy('id', 'desc')
      .first();
  }

  async scheduleForDate(habit, date, q = this.db) {
    return q('habit_schedule_versions')
      .where({ habit_id: habit.id, user_id: habit.user_id })
      .where('effective_from', '<=', date)
      .andWhere((builder) => builder.whereNull('effective_to').orWhere('effective_to', '>=', date))
      .orderBy('effective_from', 'desc')
      .orderBy('id', 'desc')
      .first();
  }

  async weekdays(schedule, q = this.db) {
    if (!schedule) return [];
    const rows = await q('habit_schedule_weekdays').where({ schedule_version_id: schedule.id }).orderBy('weekday');
    return rows.map((row) => row.weekday);
  }

  async serializeHabit(habit, q = this.db) {
    const schedule = await this.latestSchedule(habit, q);
    return toPublicHabit(habit, schedule, await this.weekdays(schedule, q));
  }

  normalizeSchedule(input, startDate = todayDate()) {
    const weekdays = [...new Set(input?.weekdays ?? [])].sort((a, b) => a - b);
    const frequencyType = input?.frequencyType ?? (weekdays.length ? 'specific_weekdays' : 'daily');
    return {
      frequencyType,
      weekdays: frequencyType === 'specific_weekdays' ? weekdays : [],
      weeklyTarget: frequencyType === 'weekly_target' ? input?.weeklyTarget ?? Math.max(1, weekdays.length || 1) : null,
      targetValue: input?.targetValue ?? 1,
      unit: input?.unit ?? null,
      effectiveFrom: input?.effectiveFrom ?? startDate,
    };
  }

  async insertSchedule(trx, habit, input, startDate) {
    const schedule = this.normalizeSchedule(input, startDate);
    const [id] = await trx('habit_schedule_versions').insert({
      habit_id: habit.id,
      user_id: habit.user_id,
      effective_from: schedule.effectiveFrom,
      effective_to: null,
      frequency_type: schedule.frequencyType,
      weekly_target: schedule.weeklyTarget,
      target_value: schedule.targetValue,
      unit: schedule.unit,
      created_at: now(),
    });
    if (schedule.weekdays.length) {
      await trx('habit_schedule_weekdays').insert(schedule.weekdays.map((weekday) => ({ schedule_version_id: id, weekday })));
    }
    return id;
  }

  async list(user, query = {}) {
    const rows = await this.db('habits')
      .where({ user_id: user.id })
      .modify((builder) => {
        if (query.status && ['active', 'archived'].includes(query.status)) builder.where({ status: query.status });
      })
      .orderBy('created_at', 'desc')
      .limit(query.limit ?? 100);
    return Promise.all(rows.map((row) => this.serializeHabit(row)));
  }

  async create(user, input) {
    return this.db.transaction(async (trx) => {
      const createdAt = now();
      const startDate = input.startDate ?? todayDate();
      const [id] = await trx('habits').insert({
        public_id: publicId(),
        user_id: user.id,
        name: input.name,
        description: input.description,
        category: input.category,
        color: input.color,
        icon: input.icon,
        reminder_time: input.reminderTime,
        start_date: startDate,
        status: 'active',
        created_at: createdAt,
        updated_at: createdAt,
      });
      const habit = await trx('habits').where({ id }).first();
      await this.insertSchedule(trx, habit, input.schedule, startDate);
      return this.serializeHabit(habit, trx);
    });
  }

  async detail(user, habitId) {
    return this.serializeHabit(await this.getHabit(user, habitId));
  }

  async update(user, habitId, input) {
    return this.db.transaction(async (trx) => {
      const habit = await this.getHabit(user, habitId, trx);
      const changes = {};
      for (const [source, target] of [
        ['name', 'name'],
        ['description', 'description'],
        ['category', 'category'],
        ['color', 'color'],
        ['icon', 'icon'],
        ['reminderTime', 'reminder_time'],
      ]) {
        if (input[source] !== undefined) changes[target] = input[source];
      }
      if (Object.keys(changes).length) {
        changes.updated_at = now();
        await trx('habits').where({ id: habit.id }).update(changes);
      }

      if (input.schedule) {
        const effectiveFrom = input.schedule.effectiveFrom ?? todayDate();
        await trx('habit_schedule_versions')
          .where({ habit_id: habit.id, user_id: user.id })
          .whereNull('effective_to')
          .where('effective_from', '<', effectiveFrom)
          .update({ effective_to: dayBefore(effectiveFrom) });
        const existing = await trx('habit_schedule_versions')
          .where({ habit_id: habit.id, user_id: user.id, effective_from: effectiveFrom })
          .first();
        if (existing) {
          const schedule = this.normalizeSchedule(input.schedule, effectiveFrom);
          await trx('habit_schedule_versions').where({ id: existing.id }).update({
            frequency_type: schedule.frequencyType,
            weekly_target: schedule.weeklyTarget,
            target_value: schedule.targetValue,
            unit: schedule.unit,
          });
          await trx('habit_schedule_weekdays').where({ schedule_version_id: existing.id }).del();
          if (schedule.weekdays.length) {
            await trx('habit_schedule_weekdays').insert(schedule.weekdays.map((weekday) => ({ schedule_version_id: existing.id, weekday })));
          }
        } else {
          await this.insertSchedule(trx, habit, input.schedule, effectiveFrom);
        }
      }

      return this.serializeHabit(await trx('habits').where({ id: habit.id }).first(), trx);
    });
  }

  async archive(user, habitId) {
    const updated = await this.db('habits').where({ public_id: habitId, user_id: user.id }).update({ status: 'archived', archived_at: now(), updated_at: now() });
    if (!updated) throw new Problem(404, 'HABIT_NOT_FOUND', 'Habito nao encontrado.');
  }

  async restore(user, habitId) {
    const updated = await this.db('habits').where({ public_id: habitId, user_id: user.id }).update({ status: 'active', archived_at: null, updated_at: now() });
    if (!updated) throw new Problem(404, 'HABIT_NOT_FOUND', 'Habito nao encontrado.');
    return this.detail(user, habitId);
  }

  isScheduled(schedule, weekdays, date) {
    if (!schedule) return false;
    if (schedule.frequency_type === 'daily') return true;
    if (schedule.frequency_type === 'specific_weekdays') return weekdays.includes(weekdayOf(date));
    return true;
  }

  async listCheckins(user, habitId, query = {}) {
    const habit = await this.getHabit(user, habitId);
    const rows = await this.db('habit_checkins')
      .select('habit_checkins.*', 'habits.public_id as habit_public_id')
      .join('habits', 'habits.id', 'habit_checkins.habit_id')
      .where({ 'habit_checkins.habit_id': habit.id, 'habit_checkins.user_id': user.id })
      .modify((builder) => {
        if (query.from) builder.where('checkin_date', '>=', query.from);
        if (query.to) builder.where('checkin_date', '<=', query.to);
      })
      .orderBy('checkin_date', 'desc')
      .limit(query.limit ?? 100);
    return Promise.all(rows.map((row) => this.serializeCheckin(row)));
  }

  async findEmotionItems(eventId, q = this.db) {
    return q('emotional_event_items')
      .select('emotional_event_items.*', 'emotions.code', 'emotions.name')
      .join('emotions', 'emotions.id', 'emotional_event_items.emotion_id')
      .where({ event_id: eventId });
  }

  async serializeEmotionEvent(event, q = this.db) {
    if (!event) return null;
    const enriched = await q('emotional_events')
      .select('emotional_events.*', 'habit_checkins.public_id as habit_checkin_public_id', 'cognitive_journal_entries.public_id as journal_public_id')
      .leftJoin('habit_checkins', 'habit_checkins.id', 'emotional_events.habit_checkin_id')
      .leftJoin('cognitive_journal_entries', 'cognitive_journal_entries.id', 'emotional_events.cognitive_journal_entry_id')
      .where({ 'emotional_events.id': event.id })
      .first();
    return toPublicEmotionalEvent(enriched, await this.findEmotionItems(event.id, q));
  }

  async serializeCheckin(row, q = this.db) {
    const event = await q('emotional_events').where({ habit_checkin_id: row.id }).first();
    return toPublicCheckin(row, await this.serializeEmotionEvent(event, q));
  }

  async upsertEmotionForCheckin(trx, user, checkin, input, date) {
    if (!input) return null;
    const timestamp = input.occurredAt ? new Date(input.occurredAt) : now();
    const current = await trx('emotional_events').where({ habit_checkin_id: checkin.id, user_id: user.id }).first();
    const payload = {
      user_id: user.id,
      source_type: 'habit_checkin',
      habit_checkin_id: checkin.id,
      cognitive_journal_entry_id: null,
      valence: input.valence,
      energy: input.energy,
      note: input.note ?? null,
      occurred_at: timestamp,
      local_date: date,
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
    await this.insertEmotionItems(trx, eventId, input.emotions ?? []);
    return trx('emotional_events').where({ id: eventId }).first();
  }

  async insertEmotionItems(trx, eventId, items) {
    const normalized = items.length ? items : [{ code: 'outra', intensity: 3, isPrimary: true }];
    const primaryIndex = normalized.findIndex((item) => item.isPrimary);
    const rows = await trx('emotions').whereIn('code', normalized.map((item) => item.code).concat('outra'));
    const byCode = Object.fromEntries(rows.map((row) => [row.code, row]));
    const fallback = byCode.outra ?? rows[0];
    if (!fallback) throw new Problem(422, 'EMOTION_CATALOG_EMPTY', 'Catalogo emocional nao configurado.');
    await trx('emotional_event_items').insert(normalized.map((item, index) => ({
      event_id: eventId,
      emotion_id: byCode[item.code]?.id ?? fallback.id,
      intensity: item.intensity ?? 3,
      resulting_intensity: item.resultingIntensity ?? null,
      is_primary: primaryIndex >= 0 ? index === primaryIndex : index === 0,
    })));
  }

  async upsertCheckin(user, habitId, date, input) {
    const habit = await this.getHabit(user, habitId);
    const schedule = await this.scheduleForDate(habit, date) ?? await this.latestSchedule(habit);
    if (!schedule) throw new Problem(422, 'SCHEDULE_REQUIRED', 'Habito sem agenda ativa.');

    return this.db.transaction(async (trx) => {
      const createdAt = now();
      const status = input.status;
      const progressValue = input.progressValue ?? (status === 'completed' ? Number(schedule.target_value) : 0);
      const completedAt = status === 'completed' ? input.completedAt ? new Date(input.completedAt) : createdAt : null;
      const payload = {
        schedule_version_id: schedule.id,
        progress_value: progressValue,
        target_snapshot: schedule.target_value,
        status,
        note: input.note,
        completed_at: completedAt,
        duration_minutes: input.durationMinutes,
        updated_at: createdAt,
      };
      await trx('habit_checkins').insert({
        public_id: publicId(),
        habit_id: habit.id,
        user_id: user.id,
        checkin_date: date,
        created_at: createdAt,
        ...payload,
      }).onConflict(['habit_id', 'checkin_date']).merge(payload);
      const checkin = await trx('habit_checkins')
        .select('habit_checkins.*', 'habits.public_id as habit_public_id')
        .join('habits', 'habits.id', 'habit_checkins.habit_id')
        .where({ 'habit_checkins.habit_id': habit.id, checkin_date: date })
        .first();
      await this.upsertEmotionForCheckin(trx, user, checkin, input.emotion, date);
      return this.serializeCheckin(checkin, trx);
    });
  }

  async deleteCheckin(user, habitId, date) {
    const habit = await this.getHabit(user, habitId);
    await this.db.transaction(async (trx) => {
      const checkin = await trx('habit_checkins').where({ habit_id: habit.id, user_id: user.id, checkin_date: date }).first();
      if (!checkin) throw new Problem(404, 'CHECKIN_NOT_FOUND', 'Execucao nao encontrada.');
      const event = await trx('emotional_events').where({ habit_checkin_id: checkin.id }).first();
      if (event) {
        await trx('emotional_event_items').where({ event_id: event.id }).del();
        await trx('emotional_events').where({ id: event.id }).del();
      }
      await trx('habit_checkins').where({ id: checkin.id }).del();
    });
  }

  async dailyPlan(user, date = todayDate()) {
    const habits = await this.db('habits').where({ user_id: user.id, status: 'active' }).orderBy('created_at', 'asc');
    const result = [];
    for (const habit of habits) {
      const schedule = await this.scheduleForDate(habit, date);
      const weekdays = await this.weekdays(schedule);
      if (!this.isScheduled(schedule, weekdays, date)) continue;
      const checkin = await this.db('habit_checkins')
        .select('habit_checkins.*', 'habits.public_id as habit_public_id')
        .join('habits', 'habits.id', 'habit_checkins.habit_id')
        .where({ 'habit_checkins.habit_id': habit.id, 'habit_checkins.checkin_date': date })
        .first();
      result.push({ habit: toPublicHabit(habit, schedule, weekdays), checkin: checkin ? await this.serializeCheckin(checkin) : null });
    }
    return { date, items: result };
  }

  async completionRows(user, from, to) {
    return this.db('habit_checkins')
      .select('habit_checkins.*', 'habits.public_id as habit_public_id', 'habits.name as habit_name')
      .join('habits', 'habits.id', 'habit_checkins.habit_id')
      .where({ 'habit_checkins.user_id': user.id })
      .whereBetween('checkin_date', [from, to]);
  }

  async habitCompletionStats(user, from, to) {
    const rows = await this.completionRows(user, from, to);
    const groups = groupBy(rows, 'habit_id');
    return Object.values(groups).map((items) => {
      const completed = items.filter((item) => item.status === 'completed').length;
      return {
        habitId: items[0].habit_public_id,
        name: items[0].habit_name,
        total: items.length,
        completed,
        completionRate: items.length ? Number((completed / items.length).toFixed(4)) : 0,
      };
    });
  }
}
