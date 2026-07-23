import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/services/auth-service.js';

const env = { TERMS_VERSION: '1.0', PRIVACY_VERSION: '1.0', BCRYPT_ROUNDS: 4, TOKEN_HMAC_SECRET: 'x'.repeat(32), REFRESH_TOKEN_TTL_DAYS: 14 };
const req = { ip: '127.0.0.1', get: vi.fn().mockReturnValue('vitest') };

function chain({ insert, update } = {}) {
  const query = {
    where: vi.fn(() => query), whereNull: vi.fn(() => query), first: vi.fn(),
    insert: insert ?? vi.fn(), update: update ?? vi.fn(), increment: vi.fn(() => query),
  };
  return query;
}

describe('AuthService', () => {
  it('converte colisão concorrente de e-mail em 409', async () => {
    const duplicate = Object.assign(new Error("Duplicate entry for key 'uq_users_email'"), { code: 'ER_DUP_ENTRY' });
    const users = chain({ insert: vi.fn().mockRejectedValue(duplicate) });
    const repository = { findUserByEmail: vi.fn().mockResolvedValue(null), users: vi.fn(() => users) };
    const db = { transaction: (callback) => callback({}) };
    const service = new AuthService({ db, repository, tokens: {}, env });
    await expect(service.register({ name: 'Usuário', email: 'user@example.com', password: 'senha-segura-123', termsVersion: '1.0', privacyVersion: '1.0' }, req))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_ALREADY_EXISTS' });
  });

  it('revoga a família quando um refresh token é reutilizado', async () => {
    const updateFamily = vi.fn().mockResolvedValue(1);
    const refresh = chain({ update: updateFamily });
    const events = { insert: vi.fn().mockResolvedValue(1) };
    const repository = {
      findRefreshByHash: vi.fn().mockResolvedValue({ id: 9, user_id: 7, family_id: 'family', revoked_at: new Date() }),
      refresh: vi.fn(() => refresh), events: vi.fn(() => events),
    };
    const db = { transaction: (callback) => callback({}) };
    const service = new AuthService({ db, repository, tokens: {}, env });
    await expect(service.rotate('reused-refresh', req)).rejects.toMatchObject({ status: 401, code: 'SESSION_REUSED' });
    expect(refresh.where).toHaveBeenCalledWith({ family_id: 'family' });
    expect(refresh.whereNull).toHaveBeenCalledWith('revoked_at');
    expect(updateFamily).toHaveBeenCalled();
    expect(events.insert).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'token_reuse', user_id: 7 }));
  });
});
