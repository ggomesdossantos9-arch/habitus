import { api, getCsrfToken } from './api.js';
import { tokenStore } from './tokenStore.js';

function saveSession(data) { tokenStore.set(data.accessToken); return data.user; }

export const authService = {
  async register(values) {
    const { data } = await api.post('/api/v1/auth/register', {
      name: values.name.trim(), email: values.email.trim().toLowerCase(), password: values.password,
      termsVersion: import.meta.env.VITE_TERMS_VERSION || '1.0', privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || '1.0',
    }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async login(values) {
    // Development helper: accept a hardcoded dev account when backend is not available
    try {
      if (import.meta.env.MODE === 'development') {
        const email = values.email.trim().toLowerCase();
        const pass = values.password;
        if (email === 'ggomesdossantos9@gmail.com' && pass === 'CAFECOMLEITE26@') {
          const devData = { accessToken: 'dev-access-token', refreshToken: 'dev-refresh', expiresAt: new Date(Date.now() + 1000 * 60 * 60), user: { id: 'dev-user', public_id: 'dev-user', name: 'Guilherme', email } };
          return saveSession(devData);
        }
      }
    } catch (e) {
      // ignore and fall back to real login
    }
    const { data } = await api.post('/api/v1/auth/login', { email: values.email.trim().toLowerCase(), password: values.password }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async me() { const { data } = await api.get('/api/v1/users/me'); return data.data; },
  async logout() {
    try { const csrf = await getCsrfToken(); await api.post('/api/v1/auth/logout', {}, { skipAuthRefresh: true, headers: { 'X-CSRF-Token': csrf } }); }
    finally { tokenStore.clear(); }
  },
};
