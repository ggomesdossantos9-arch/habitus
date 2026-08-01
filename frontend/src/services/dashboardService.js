import { api } from './api.js';

export const dashboardService = {
  async summary() {
    const { data } = await api.get('/api/v1/dashboard/summary');
    return data.data;
  },
};
