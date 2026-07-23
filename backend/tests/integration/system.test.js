import { describe, expect, it } from 'vitest';
import request from 'supertest';
import pino from 'pino';
import { createApp } from '../../src/app.js';

const db = Object.assign(() => { throw new Error('not used'); }, { raw: async () => [{ 1: 1 }] });
const env = { WEB_ORIGINS: ['http://localhost:5173'], TRUST_PROXY: 0, COOKIE_SECURE: false, COOKIE_SAME_SITE: 'lax', REFRESH_TOKEN_TTL_DAYS: 14 };
const app = createApp({ env, db, tokens: {}, logger: pino({ enabled: false }) });
describe('sistema', () => {
  it('expõe liveness e readiness sem detalhes internos', async () => {
    expect((await request(app).get('/health')).body).toEqual({ data: { status: 'ok' } });
    expect((await request(app).get('/ready')).body).toEqual({ data: { status: 'ready' } });
  });
  it('retorna Problem Details em rota ausente', async () => { const response = await request(app).get('/inexistente'); expect(response.status).toBe(404); expect(response.type).toBe('application/problem+json'); expect(response.body.code).toBe('NOT_FOUND'); });
  it('bloqueia origem não autorizada', async () => { expect((await request(app).get('/health').set('Origin', 'https://evil.example')).status).toBe(403); });
});
