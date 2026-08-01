import { api } from './api.js';

export const journalService = {
  async list(params = {}) {
    const { data } = await api.get('/api/v1/journals', { params });
    return data.data ?? [];
  },
  async create(values) {
    const { data } = await api.post('/api/v1/journals', values);
    return data.data;
  },
  async update(entryId, values) {
    const { data } = await api.patch(`/api/v1/journals/${entryId}`, values);
    return data.data;
  },
  async remove(entryId) {
    await api.delete(`/api/v1/journals/${entryId}`);
  },
};
