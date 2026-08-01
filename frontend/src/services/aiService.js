import { api } from './api.js';

export const aiService = {
  async create(values) {
    const { data } = await api.post('/api/v1/ai/insights', values);
    return data.data;
  },
  async list(params = {}) {
    const { data } = await api.get('/api/v1/ai/insights', { params });
    return data.data ?? [];
  },
};
