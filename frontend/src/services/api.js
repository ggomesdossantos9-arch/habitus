import axios from 'axios';
import { tokenStore } from './tokenStore.js';
import { notifySessionExpired } from './sessionEvents.js';

const baseURL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const api = axios.create({ baseURL, withCredentials: true, timeout: 15000, headers: { Accept: 'application/json' } });
let refreshPromise = null;
let csrfPromise = null;

export function getProblemMessage(error) {
  const body = error?.response?.data;
  return body?.detail || body?.message || body?.title || (error?.code === 'ECONNABORTED' ? 'A solicitação demorou demais. Tente novamente.' : 'Não foi possível concluir. Tente novamente.');
}

export async function getCsrfToken() {
  csrfPromise ??= api.get('/api/v1/auth/csrf', { skipAuthRefresh: true }).then(({ data }) => data.data.csrfToken).finally(() => { csrfPromise = null; });
  return csrfPromise;
}

export async function refreshSession() {
  refreshPromise ??= getCsrfToken().then((csrf) => api.post('/api/v1/auth/refresh', {}, { skipAuthRefresh: true, headers: { 'X-CSRF-Token': csrf } })).then(({ data }) => {
    tokenStore.set(data.data.accessToken);
    return data.data;
  }).catch((error) => {
    tokenStore.clear();
    notifySessionExpired();
    throw error;
  }).finally(() => { refreshPromise = null; });
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  if (error.response?.status !== 401 || request?.skipAuthRefresh || request?._retried) return Promise.reject(error);
  request._retried = true;
  await refreshSession();
  request.headers.Authorization = `Bearer ${tokenStore.get()}`;
  return api(request);
});
