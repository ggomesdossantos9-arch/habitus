import { randomUUID } from 'node:crypto';

export const todayDate = () => new Date().toISOString().slice(0, 10);
export const dateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
};

export const dateTime = (value) => (value ? new Date(value).toISOString() : null);
export const timeOnly = (value) => (value ? String(value).slice(0, 5) : null);
export const now = () => new Date();
export const publicId = () => randomUUID();

export function parseJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeDateRange({ from, to, days = 30 } = {}) {
  const end = to ? dateOnly(to) : todayDate();
  const start = from ? dateOnly(from) : dateOnly(new Date(Date.now() - (days - 1) * 86400000));
  return { from: start, to: end };
}

export function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = typeof key === 'function' ? key(row) : row[key];
    acc[value] ??= [];
    acc[value].push(row);
    return acc;
  }, {});
}

export function toPublicEmotion(row) {
  return {
    id: row.code,
    code: row.code,
    name: row.name,
    defaultValence: row.default_valence,
    displayOrder: row.display_order,
  };
}

export function toPublicUser(user) {
  return {
    id: user.public_id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    locale: user.locale,
    plan: user.plan_code ?? 'free',
    createdAt: user.created_at,
  };
}

export function toPublicHabit(row, schedule = null, weekdays = []) {
  const targetValue = schedule ? Number(schedule.target_value) : null;
  return {
    id: row.public_id,
    name: row.name,
    description: row.description,
    category: row.category ?? null,
    color: row.color,
    icon: row.icon,
    meta: targetValue,
    daysOfWeek: weekdays,
    reminderTime: timeOnly(row.reminder_time),
    status: row.status,
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    schedule: schedule ? {
      id: schedule.id,
      frequencyType: schedule.frequency_type,
      weeklyTarget: schedule.weekly_target,
      targetValue,
      unit: schedule.unit,
      effectiveFrom: dateOnly(schedule.effective_from),
      effectiveTo: dateOnly(schedule.effective_to),
      weekdays,
    } : null,
  };
}

export function toPublicCheckin(row, emotion = null) {
  return {
    id: row.public_id,
    habitId: row.habit_public_id,
    date: dateOnly(row.checkin_date),
    status: row.status,
    progressValue: Number(row.progress_value),
    targetSnapshot: Number(row.target_snapshot),
    completedAt: dateTime(row.completed_at),
    durationMinutes: row.duration_minutes,
    note: row.note,
    emotion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublicJournal(row, emotion = null) {
  return {
    id: row.public_id,
    title: row.title,
    text: row.body ?? row.situation,
    mood: row.mood,
    occurredAt: dateTime(row.occurred_at),
    date: dateOnly(row.occurred_at),
    status: row.status,
    situation: row.situation,
    automaticThoughts: row.automatic_thoughts,
    evidenceFor: row.evidence_for,
    evidenceAgainst: row.evidence_against,
    alternativeThought: row.alternative_thought,
    behavioralResponse: row.behavioral_response,
    outcome: row.outcome,
    aiAnalysis: parseJson(row.ai_analysis),
    emotion,
    lastSavedAt: dateTime(row.last_saved_at),
    lockVersion: row.lock_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublicEmotionalEvent(row, items = []) {
  return {
    id: row.public_id,
    sourceType: row.source_type,
    valence: row.valence,
    energy: row.energy,
    note: row.note,
    occurredAt: dateTime(row.occurred_at),
    localDate: dateOnly(row.local_date),
    habitCheckinId: row.habit_checkin_public_id ?? null,
    journalEntryId: row.journal_public_id ?? null,
    emotions: items.map((item) => ({
      code: item.code,
      name: item.name,
      intensity: item.intensity,
      resultingIntensity: item.resulting_intensity,
      isPrimary: Boolean(item.is_primary),
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPublicInsight(row) {
  return {
    id: row.public_id,
    type: row.insight_type,
    status: row.status,
    provider: row.provider,
    model: row.model_id,
    promptVersion: row.prompt_version,
    content: parseJson(row.content_json),
    safetyLevel: row.safety_level,
    periodStart: dateOnly(row.period_start),
    periodEnd: dateOnly(row.period_end),
    completedAt: dateTime(row.completed_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
