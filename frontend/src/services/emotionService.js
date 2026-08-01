import { api } from './api.js';

export const emotionService = {
  async catalog() {
    const { data } = await api.get('/api/v1/emotions/catalog');
    return data.data ?? [];
  },
  async list(params = {}) {
    const { data } = await api.get('/api/v1/emotions', { params });
    return data.data ?? [];
  },
  async create(values) {
    const { data } = await api.post('/api/v1/emotions', values);
    return data.data;
  },
  async remove(eventId) {
    await api.delete(`/api/v1/emotions/${eventId}`);
  },
};
