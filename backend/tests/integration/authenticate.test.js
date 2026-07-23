import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { authenticate } from '../../src/middlewares/authenticate.js';
import { errorHandler } from '../../src/utils/problem.js';

function appFor({ payload = { sub: 'public-user', ver: 1 }, user = { id: 1, public_id: 'public-user', status: 'active', auth_version: 1 } } = {}) {
  const tokens = { verify: vi.fn().mockResolvedValue(payload) };
  const repository = { findUserByPublicId: vi.fn().mockResolvedValue(user) };
  const app = express();
  app.get('/protected', authenticate({ tokens, repository }), (req, res) => res.json({ data: { id: req.user.public_id } }));
  app.use((req, _res, next) => { req.id = 'test-request'; next(); });
  app.use(errorHandler);
  return { app, tokens, repository };
}

describe('middleware authenticate', () => {
  it('aceita bearer válido e carrega o usuário ativo', async () => {
    const { app, tokens } = appFor();
    const response = await request(app).get('/protected').set('Authorization', 'Bearer signed-token');
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('public-user');
    expect(tokens.verify).toHaveBeenCalledWith('signed-token');
  });

  it('rejeita token ausente e auth_version divergente', async () => {
    expect((await request(appFor().app).get('/protected')).status).toBe(401);
    const versionMismatch = appFor({ payload: { sub: 'public-user', ver: 1 }, user: { id: 1, public_id: 'public-user', status: 'active', auth_version: 2 } });
    expect((await request(versionMismatch.app).get('/protected').set('Authorization', 'Bearer token')).status).toBe(401);
  });
});
