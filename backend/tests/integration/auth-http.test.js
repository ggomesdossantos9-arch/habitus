import request from 'supertest';
import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';

const user = { id: 1, public_id: 'user-public', name: 'Usuário', email: 'user@example.com', timezone: 'America/Sao_Paulo', locale: 'pt-BR', status: 'active', auth_version: 1, created_at: new Date('2026-06-22T00:00:00Z') };

function fixture() {
  const service = {
    register: vi.fn().mockResolvedValue({ user: { id: user.public_id }, accessToken: 'access-register', refreshToken: 'refresh-register', expiresAt: new Date() }),
    login: vi.fn().mockResolvedValue({ user: { id: user.public_id }, accessToken: 'access-login', refreshToken: 'refresh-login', expiresAt: new Date() }),
    rotate: vi.fn().mockResolvedValue({ accessToken: 'access-next', refreshToken: 'refresh-next', expiresAt: new Date() }),
    logout: vi.fn().mockResolvedValue(), logoutAll: vi.fn().mockResolvedValue(),
    reauthenticate: vi.fn().mockResolvedValue('reauth-token'), profile: vi.fn().mockReturnValue({ id: user.public_id }),
  };
  const tokens = { verify: vi.fn().mockResolvedValue({ sub: user.public_id, ver: 1 }) };
  const repository = { findUserByPublicId: vi.fn().mockResolvedValue(user) };
  const db = Object.assign(() => { throw new Error('not used'); }, { raw: vi.fn().mockResolvedValue([{ 1: 1 }]) });
  const env = { WEB_ORIGINS: ['http://localhost:5173'], TRUST_PROXY: 0, COOKIE_SECURE: false, COOKIE_SAME_SITE: 'lax', REFRESH_TOKEN_TTL_DAYS: 14 };
  const app = createApp({ env, db, tokens, logger: pino({ enabled: false }), overrides: { service, repository } });
  return { app, service };
}

describe('HTTP de autenticação', () => {
  it('cadastra e envia refresh somente em cookie HttpOnly', async () => {
    const { app, service } = fixture();
    const body = { name: 'Usuário Teste', email: 'USER@example.com', password: 'senha-segura-123', termsVersion: '1.0', privacyVersion: '1.0' };
    const response = await request(app).post('/api/v1/auth/register').send(body);
    expect(response.status).toBe(201);
    expect(response.headers['set-cookie'][0]).toMatch(/habitus_refresh=refresh-register.*HttpOnly.*SameSite=Lax/i);
    expect(response.body.data.refreshToken).toBeUndefined();
    expect(service.register).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com' }), expect.anything());
  });

  it('exige CSRF no refresh e rotaciona o cookie quando válido', async () => {
    const { app, service } = fixture();
    expect((await request(app).post('/api/v1/auth/refresh').set('Cookie', 'habitus_refresh=refresh-old')).status).toBe(403);

    const csrf = await request(app).get('/api/v1/auth/csrf');
    const csrfToken = csrf.body.data.csrfToken;
    const csrfCookie = csrf.headers['set-cookie'][0].split(';')[0];
    const response = await request(app).post('/api/v1/auth/refresh').set('Origin', 'http://localhost:5173')
      .set('X-CSRF-Token', csrfToken).set('Cookie', [csrfCookie, 'habitus_refresh=refresh-old']);
    expect(response.status).toBe(200);
    expect(service.rotate).toHaveBeenCalledWith('refresh-old', expect.anything());
    expect(response.headers['set-cookie'][0]).toContain('habitus_refresh=refresh-next');
  });

  it('rejeita CSRF Unicode inválido sem produzir erro interno', async () => {
    const { app } = fixture();
    const cookie = 'a'.repeat(43);
    const header = `${'a'.repeat(42)}é`;
    const response = await request(app).post('/api/v1/auth/logout').set('Cookie', [`habitus_csrf=${cookie}`, 'habitus_refresh=refresh-old']).set('X-CSRF-Token', header);
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('CSRF_INVALID');
  });

  it('protege perfil e logout global com bearer e auth_version', async () => {
    const { app, service } = fixture();
    expect((await request(app).get('/api/v1/users/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/users/me').set('Authorization', 'Bearer access')).status).toBe(200);
    const logoutAll = await request(app).post('/api/v1/auth/logout-all').set('Authorization', 'Bearer access');
    expect(logoutAll.status).toBe(204);
    expect(logoutAll.headers['set-cookie'].join(';')).not.toMatch(/Max-Age=[1-9]/i);
    expect(service.logoutAll).toHaveBeenCalled();
  });
});
