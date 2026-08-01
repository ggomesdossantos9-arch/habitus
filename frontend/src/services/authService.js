import { api, getCsrfToken } from './api.js';
import { tokenStore } from './tokenStore.js';

function saveSession(data) {
  tokenStore.set(data.accessToken);
  return data.user;
}

export const authService = {
  async register(values) {
    const { data } = await api.post('/api/v1/auth/register', {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      termsVersion: import.meta.env.VITE_TERMS_VERSION || '1.0',
      privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || '1.0',
    }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async login(values) {
    const email = values.email.trim().toLowerCase();
    const pass = values.password;
    const { data } = await api.post('/api/v1/auth/login', { email, password: pass }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async me() { const { data } = await api.get('/api/v1/users/me'); return data.data; },
  async logout() {
    try {
      const csrf = await getCsrfToken();
      await api.post('/api/v1/auth/logout', {}, { skipAuthRefresh: true, headers: { 'X-CSRF-Token': csrf } });
    } finally {
      tokenStore.clear();
    }
  },
};
