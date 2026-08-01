import { api } from './api.js';

function normalizeHabit(payload) {
  return {
    id: payload.id,
    name: payload.name,
    description: payload.description ?? '',
    category: payload.category ?? null,
    color: payload.color ?? '#4f46e5',
    icon: payload.icon ?? 'check-circle',
    meta: payload.meta ?? payload.schedule?.targetValue ?? 1,
    daysOfWeek: payload.daysOfWeek ?? payload.schedule?.weekdays ?? [],
    reminderTime: payload.reminderTime ?? null,
    status: payload.status ?? 'active',
    startDate: payload.startDate ?? null,
    endDate: payload.endDate ?? null,
    schedule: payload.schedule ?? null,
  };
}

export const habitService = {
  async list() {
    const { data } = await api.get('/api/v1/habits');
    return (data.data ?? []).map(normalizeHabit);
  },
  async create(values) {
    const body = {
      name: values.name,
      description: values.description ?? null,
      category: values.category ?? null,
      color: values.color ?? '#4f46e5',
      icon: values.icon ?? 'check-circle',
      reminderTime: values.reminderTime ?? null,
      startDate: values.startDate ?? null,
      meta: values.meta ?? 1,
      daysOfWeek: values.daysOfWeek ?? [],
    };
    const { data } = await api.post('/api/v1/habits', body);
    return normalizeHabit(data.data);
  },
  async update(habitId, values) {
    const { data } = await api.patch(`/api/v1/habits/${habitId}`, values);
    return normalizeHabit(data.data);
  },
  async remove(habitId) {
    await api.delete(`/api/v1/habits/${habitId}`);
  },
  async restore(habitId) {
    const { data } = await api.post(`/api/v1/habits/${habitId}/restore`);
    return normalizeHabit(data.data);
  },
  async listCheckins(habitId) {
    const { data } = await api.get(`/api/v1/habits/${habitId}/checkins`);
    return data.data ?? [];
  },
  async upsertCheckin(habitId, date, payload) {
    const { data } = await api.put(`/api/v1/habits/${habitId}/checkins/${date}`, payload);
    return data.data;
  },
  async deleteCheckin(habitId, date) {
    await api.delete(`/api/v1/habits/${habitId}/checkins/${date}`);
  },
  async dailyPlan(date) {
    const { data } = await api.get('/api/v1/daily-plan', { params: date ? { date } : {} });
    return data.data;
  },
};
