import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/).optional().nullable();
const publicId = z.string().uuid();
const nullableString = (max = 500) => z.string().trim().max(max).optional().nullable();
const alias = (value, ...names) => names.map((name) => value[name]).find((item) => item !== undefined);
const atMost72Bytes = (value) => Buffer.byteLength(value, 'utf8') <= 72;
const password = z.string().min(12).max(72).refine(atMost72Bytes, 'A senha excede 72 bytes');

const weekday = z.coerce.number().int().min(1).max(7);
const schedule = z.object({
  frequencyType: z.enum(['daily', 'specific_weekdays', 'weekly_target']).optional(),
  frequency_type: z.enum(['daily', 'specific_weekdays', 'weekly_target']).optional(),
  weekdays: z.array(weekday).max(7).optional(),
  diasDaSemana: z.array(weekday).max(7).optional(),
  dias_da_semana: z.array(weekday).max(7).optional(),
  weeklyTarget: z.coerce.number().int().min(1).max(7).optional().nullable(),
  weekly_target: z.coerce.number().int().min(1).max(7).optional().nullable(),
  targetValue: z.coerce.number().positive().optional(),
  target_value: z.coerce.number().positive().optional(),
  unit: z.string().trim().max(30).optional().nullable(),
  effectiveFrom: date.optional(),
  effective_from: date.optional(),
}).passthrough().transform((value) => ({
  frequencyType: value.frequencyType ?? value.frequency_type ?? 'daily',
  weekdays: value.weekdays ?? value.diasDaSemana ?? value.dias_da_semana ?? [],
  weeklyTarget: value.weeklyTarget ?? value.weekly_target ?? null,
  targetValue: value.targetValue ?? value.target_value ?? 1,
  unit: value.unit ?? null,
  effectiveFrom: value.effectiveFrom ?? value.effective_from,
}));

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72).refine(atMost72Bytes, 'A senha excede 72 bytes'),
  newPassword: password,
}).strict();

export const deleteAccountSchema = z.object({
  password: z.string().min(1).max(72).refine(atMost72Bytes, 'A senha excede 72 bytes'),
}).strict();

export const consentEventSchema = z.object({
  type: z.enum(['terms', 'privacy', 'ai_processing']),
  action: z.enum(['granted', 'revoked']),
  documentVersion: z.string().trim().min(1).max(30),
}).strict();

export const idParamSchema = z.object({ id: publicId }).passthrough();
export const habitParamSchema = z.object({ habitId: publicId }).passthrough();
export const checkinParamSchema = z.object({ habitId: publicId, date }).strict();
export const entryParamSchema = z.object({ entryId: publicId }).passthrough();
export const eventParamSchema = z.object({ eventId: publicId }).passthrough();
export const insightParamSchema = z.object({ insightId: publicId }).passthrough();

export const listQuerySchema = z.object({
  status: z.string().trim().max(30).optional(),
  from: date.optional(),
  to: date.optional(),
  source: z.string().trim().max(40).optional(),
  asOf: date.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
}).passthrough();

export const dateQuerySchema = z.object({ date: date.optional() }).passthrough();

export const habitCreateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  nome: z.string().trim().min(1).max(120).optional(),
  description: nullableString(),
  descricao: nullableString(),
  category: nullableString(80),
  categoria: nullableString(80),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  cor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  icon: nullableString(50),
  icone: nullableString(50),
  meta: z.coerce.number().positive().optional(),
  daysOfWeek: z.array(weekday).max(7).optional(),
  diasDaSemana: z.array(weekday).max(7).optional(),
  dias_da_semana: z.array(weekday).max(7).optional(),
  reminderTime: time,
  horario: time,
  startDate: date.optional(),
  dataCriacao: date.optional(),
  schedule: schedule.optional(),
}).passthrough().transform((value) => ({
  name: value.name ?? value.nome,
  description: value.description ?? value.descricao ?? null,
  category: value.category ?? value.categoria ?? null,
  color: value.color ?? value.cor ?? '#4f46e5',
  icon: value.icon ?? value.icone ?? 'check-circle',
  reminderTime: value.reminderTime ?? value.horario ?? null,
  startDate: value.startDate ?? value.dataCriacao,
  schedule: value.schedule ?? {
    frequencyType: (value.daysOfWeek ?? value.diasDaSemana ?? value.dias_da_semana)?.length ? 'specific_weekdays' : 'daily',
    weekdays: value.daysOfWeek ?? value.diasDaSemana ?? value.dias_da_semana ?? [],
    weeklyTarget: null,
    targetValue: value.meta ?? 1,
    unit: null,
    effectiveFrom: value.startDate ?? value.dataCriacao,
  },
})).superRefine((value, context) => {
  if (!value.name) context.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Nome obrigatorio.' });
});

export const habitUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  nome: z.string().trim().min(1).max(120).optional(),
  description: nullableString(),
  descricao: nullableString(),
  category: nullableString(80),
  categoria: nullableString(80),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  cor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  icon: nullableString(50),
  icone: nullableString(50),
  meta: z.coerce.number().positive().optional(),
  daysOfWeek: z.array(weekday).max(7).optional(),
  diasDaSemana: z.array(weekday).max(7).optional(),
  dias_da_semana: z.array(weekday).max(7).optional(),
  reminderTime: time,
  horario: time,
  schedule: schedule.optional(),
}).passthrough().transform((value) => {
  const weekdays = value.daysOfWeek ?? value.diasDaSemana ?? value.dias_da_semana;
  const hasScheduleFields = value.schedule || value.meta !== undefined || weekdays !== undefined;
  return {
    name: value.name ?? value.nome,
    description: value.description ?? value.descricao,
    category: value.category ?? value.categoria,
    color: value.color ?? value.cor,
    icon: value.icon ?? value.icone,
    reminderTime: value.reminderTime ?? value.horario,
    schedule: value.schedule ?? (hasScheduleFields ? {
      frequencyType: weekdays?.length ? 'specific_weekdays' : 'daily',
      weekdays: weekdays ?? [],
      weeklyTarget: null,
      targetValue: value.meta ?? 1,
      unit: null,
    } : undefined),
  };
});

const checkinStatus = z.enum(['in_progress', 'completed', 'skipped', 'concluido', 'concluído', 'nao_concluido', 'não_concluído', 'não concluído'])
  .transform((value) => {
    if (['concluido', 'concluído'].includes(value)) return 'completed';
    if (['nao_concluido', 'não_concluído', 'não concluído'].includes(value)) return 'skipped';
    return value;
  });

export const emotionItemsSchema = z.array(z.object({
  code: z.string().trim().min(1).max(50),
  intensity: z.coerce.number().int().min(1).max(5).default(3),
  resultingIntensity: z.coerce.number().int().min(1).max(5).optional().nullable(),
  isPrimary: z.boolean().optional().default(false),
})).max(8).optional();

export const checkinSchema = z.object({
  status: checkinStatus.default('completed'),
  progressValue: z.coerce.number().min(0).optional(),
  progress_value: z.coerce.number().min(0).optional(),
  tempoGasto: z.coerce.number().int().min(0).optional().nullable(),
  durationMinutes: z.coerce.number().int().min(0).optional().nullable(),
  observacao: nullableString(),
  note: nullableString(),
  completedAt: z.string().datetime().optional().nullable(),
  emotion: z.object({
    valence: z.coerce.number().int().min(-2).max(2),
    energy: z.coerce.number().int().min(1).max(5),
    note: nullableString(),
    emotions: emotionItemsSchema.default([]),
  }).optional().nullable(),
  emocao: z.object({
    valence: z.coerce.number().int().min(-2).max(2).optional(),
    energy: z.coerce.number().int().min(1).max(5).optional(),
    code: z.string().trim().max(50).optional(),
    intensity: z.coerce.number().int().min(1).max(5).optional(),
  }).optional().nullable(),
}).passthrough().transform((value) => ({
  status: value.status,
  progressValue: value.progressValue ?? value.progress_value,
  durationMinutes: value.durationMinutes ?? value.tempoGasto ?? null,
  note: value.note ?? value.observacao ?? null,
  completedAt: value.completedAt ?? null,
  emotion: value.emotion ?? (value.emocao?.code ? {
    valence: value.emocao.valence ?? 0,
    energy: value.emocao.energy ?? 3,
    note: null,
    emotions: [{ code: value.emocao.code, intensity: value.emocao.intensity ?? 3, isPrimary: true }],
  } : null),
}));

export const emotionalEventSchema = z.object({
  sourceType: z.enum(['standalone']).optional().default('standalone'),
  valence: z.coerce.number().int().min(-2).max(2),
  energy: z.coerce.number().int().min(1).max(5),
  note: nullableString(),
  occurredAt: z.string().datetime().optional(),
  localDate: date.optional(),
  emotions: emotionItemsSchema.default([]),
}).strict();

export const journalSchema = z.object({
  title: nullableString(150),
  titulo: nullableString(150),
  text: z.string().trim().max(20000).optional().nullable(),
  texto: z.string().trim().max(20000).optional().nullable(),
  mood: nullableString(80),
  humor: nullableString(80),
  occurredAt: z.string().datetime().optional(),
  data: date.optional(),
  hora: time,
  status: z.enum(['draft', 'completed']).optional(),
  situation: z.string().trim().max(20000).optional().nullable(),
  automaticThoughts: z.string().trim().max(20000).optional().nullable(),
  evidenceFor: z.string().trim().max(20000).optional().nullable(),
  evidenceAgainst: z.string().trim().max(20000).optional().nullable(),
  alternativeThought: z.string().trim().max(20000).optional().nullable(),
  behavioralResponse: z.string().trim().max(20000).optional().nullable(),
  outcome: z.string().trim().max(20000).optional().nullable(),
  emotion: z.object({
    valence: z.coerce.number().int().min(-2).max(2),
    energy: z.coerce.number().int().min(1).max(5),
    note: nullableString(),
    emotions: emotionItemsSchema.default([]),
  }).optional().nullable(),
}).passthrough().transform((value) => {
  const occurredAt = value.occurredAt ?? (value.data ? `${value.data}T${value.hora ?? '12:00'}:00.000Z` : undefined);
  return {
    title: value.title ?? value.titulo ?? null,
    text: value.text ?? value.texto ?? value.situation ?? null,
    mood: value.mood ?? value.humor ?? null,
    occurredAt,
    status: value.status ?? 'draft',
    situation: value.situation ?? value.text ?? value.texto ?? null,
    automaticThoughts: value.automaticThoughts ?? null,
    evidenceFor: value.evidenceFor ?? null,
    evidenceAgainst: value.evidenceAgainst ?? null,
    alternativeThought: value.alternativeThought ?? null,
    behavioralResponse: value.behavioralResponse ?? null,
    outcome: value.outcome ?? null,
    emotion: value.emotion ?? null,
  };
});

export const journalUpdateSchema = z.object({
  title: nullableString(150),
  titulo: nullableString(150),
  text: z.string().trim().max(20000).optional().nullable(),
  texto: z.string().trim().max(20000).optional().nullable(),
  mood: nullableString(80),
  humor: nullableString(80),
  occurredAt: z.string().datetime().optional(),
  data: date.optional(),
  hora: time,
  status: z.enum(['draft', 'completed']).optional(),
  situation: z.string().trim().max(20000).optional().nullable(),
  automaticThoughts: z.string().trim().max(20000).optional().nullable(),
  evidenceFor: z.string().trim().max(20000).optional().nullable(),
  evidenceAgainst: z.string().trim().max(20000).optional().nullable(),
  alternativeThought: z.string().trim().max(20000).optional().nullable(),
  behavioralResponse: z.string().trim().max(20000).optional().nullable(),
  outcome: z.string().trim().max(20000).optional().nullable(),
  emotion: z.object({
    valence: z.coerce.number().int().min(-2).max(2),
    energy: z.coerce.number().int().min(1).max(5),
    note: nullableString(),
    emotions: emotionItemsSchema.default([]),
  }).optional().nullable(),
}).passthrough().transform((value) => {
  const occurredAt = value.occurredAt ?? (value.data ? `${value.data}T${value.hora ?? '12:00'}:00.000Z` : undefined);
  return {
    title: value.title ?? value.titulo,
    text: value.text ?? value.texto,
    mood: value.mood ?? value.humor,
    occurredAt,
    status: value.status,
    situation: value.situation,
    automaticThoughts: value.automaticThoughts,
    evidenceFor: value.evidenceFor,
    evidenceAgainst: value.evidenceAgainst,
    alternativeThought: value.alternativeThought,
    behavioralResponse: value.behavioralResponse,
    outcome: value.outcome,
    emotion: value.emotion,
  };
});

export const aiInsightSchema = z.object({
  type: z.enum(['journal_reflection', 'emotional_summary', 'habit_coaching']),
  journalEntryId: publicId.optional(),
  habitId: publicId.optional(),
  periodStart: date.optional(),
  periodEnd: date.optional(),
}).strict().superRefine((value, context) => {
  if (value.type === 'journal_reflection' && !value.journalEntryId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['journalEntryId'], message: 'Diario obrigatorio.' });
  if (value.type === 'habit_coaching' && !value.habitId) context.addIssue({ code: z.ZodIssueCode.custom, path: ['habitId'], message: 'Habito obrigatorio.' });
  if (value.type === 'emotional_summary' && (!value.periodStart || !value.periodEnd)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['periodStart'], message: 'Periodo obrigatorio.' });
});
