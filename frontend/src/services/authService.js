import { api, getCsrfToken } from './api.js';
import { tokenStore } from './tokenStore.js';

function saveSession(data) { tokenStore.set(data.accessToken); return data.user; }

function createDemoUser(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const localPart = normalizedEmail.split('@')[0] || 'usuario-demo';
  const displayName = localPart
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ') || 'Usuário Demo';

  return {
    id: `demo-${localPart}`,
    public_id: `demo-${localPart}`,
    name: displayName,
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  async register(values) {
    const { data } = await api.post('/api/v1/auth/register', {
      name: values.name.trim(), email: values.email.trim().toLowerCase(), password: values.password,
      termsVersion: import.meta.env.VITE_TERMS_VERSION || '1.0', privacyVersion: import.meta.env.VITE_PRIVACY_VERSION || '1.0',
    }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async login(values) {
    // Temporary demo login logic: aceita qualquer e-mail com gmail.com e qualquer senha não vazia.
    // Esse código é provisório e deve ser removido quando o backend real de autenticação estiver em produção.
    const email = values.email.trim().toLowerCase();
    const pass = values.password;
    if (email.includes('gmail.com') && pass && pass.length > 0) {
      const demoData = {
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: createDemoUser(email),
      };
      return saveSession(demoData);
    }

    try {
      if (import.meta.env.MODE === 'development') {
        if (email === 'ggomesdossantos9@gmail.com' && pass === 'CAFECOMLEITE26@') {
          const devData = { accessToken: 'dev-access-token', refreshToken: 'dev-refresh', expiresAt: new Date(Date.now() + 1000 * 60 * 60), user: { id: 'dev-user', public_id: 'dev-user', name: 'Guilherme', email } };
          return saveSession(devData);
        }
      }
    } catch (e) {
      // ignore and fall back to real login
    }

    const { data } = await api.post('/api/v1/auth/login', { email, password: pass }, { skipAuthRefresh: true });
    return saveSession(data.data);
  },
  async me() { const { data } = await api.get('/api/v1/users/me'); return data.data; },
  async logout() {
    try { const csrf = await getCsrfToken(); await api.post('/api/v1/auth/logout', {}, { skipAuthRefresh: true, headers: { 'X-CSRF-Token': csrf } }); }
    finally { tokenStore.clear(); }
  },
};
