import { api } from './api.js';

export const telemetryService = {
  async summary(params = {}) {
    const { data } = await api.get('/api/v1/telemetry/summary', { params });
    return data.data;
  },
  async distribution(params = {}) {
    const { data } = await api.get('/api/v1/telemetry/distribution', { params });
    return data.data ?? [];
  },
  async trends(params = {}) {
    const { data } = await api.get('/api/v1/telemetry/trends', { params });
    return data.data ?? [];
  },
  async habitCorrelations(params = {}) {
    const { data } = await api.get('/api/v1/telemetry/habit-correlations', { params });
    return data.data ?? [];
  },
};
