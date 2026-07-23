import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { Problem } from '../utils/problem.js';
import { ipHmac, randomToken, tokenHash } from '../utils/crypto.js';
import { toPublicUser } from '../models/user.js';

export class AuthService {
  constructor({ db, repository, tokens, env }) { Object.assign(this, { db, repository, tokens, env }); this.dummyPasswordHash = null; }
  async timingSafePasswordHash() { this.dummyPasswordHash ??= bcrypt.hash(randomToken(), this.env.BCRYPT_ROUNDS); return this.dummyPasswordHash; }
  context(req) { return { user_agent: req.get('user-agent')?.slice(0, 255) ?? null, ip_hmac: ipHmac(req.ip, this.env.TOKEN_HMAC_SECRET) }; }
  async createSession(user, req, trx = this.db) {
    const raw = randomToken(), now = new Date(), expires = new Date(now.getTime() + this.env.REFRESH_TOKEN_TTL_DAYS * 86400000);
    await this.repository.refresh(trx).insert({ user_id: user.id, family_id: randomUUID(), token_hash: tokenHash(raw), expires_at: expires, ...this.context(req), created_at: now });
    return { accessToken: await this.tokens.sign(user), refreshToken: raw, expiresAt: expires };
  }
  async register(input, req) {
    if (input.termsVersion !== this.env.TERMS_VERSION || input.privacyVersion !== this.env.PRIVACY_VERSION) throw new Problem(422, 'CONSENT_VERSION_INVALID', 'As versões vigentes dos documentos devem ser aceitas.');
    const passwordHash = await bcrypt.hash(input.password, this.env.BCRYPT_ROUNDS);
    try {
      return await this.db.transaction(async (trx) => {
        if (await this.repository.findUserByEmail(input.email, trx)) throw new Problem(409, 'EMAIL_ALREADY_EXISTS', 'Não foi possível cadastrar este e-mail.');
        const now = new Date(), publicId = randomUUID();
        const [id] = await this.repository.users(trx).insert({ public_id: publicId, name: input.name, email: input.email, password_hash: passwordHash, password_changed_at: now, created_at: now, updated_at: now });
        const user = await this.repository.users(trx).where({ id }).first();
        await this.repository.consents(trx).insert(['terms','privacy'].map((consent_type) => ({ user_id: id, consent_type, document_version: consent_type === 'terms' ? input.termsVersion : input.privacyVersion, action: 'granted', occurred_at: now, created_at: now })));
        await this.repository.events(trx).insert({ user_id: id, event_type: 'register', ...this.context(req), created_at: now });
        return { user: toPublicUser(user), ...(await this.createSession(user, req, trx)) };
      });
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY' && String(error.message).includes('uq_users_email')) throw new Problem(409, 'EMAIL_ALREADY_EXISTS', 'Não foi possível cadastrar este e-mail.');
      throw error;
    }
  }
  async login(input, req) {
    const user = await this.repository.findUserByEmail(input.email);
    const valid = await bcrypt.compare(input.password, user?.password_hash ?? await this.timingSafePasswordHash());
    if (!user || !valid || user.status !== 'active') {
      await this.repository.events().insert({ user_id: user?.id ?? null, event_type: 'login_failure', ...this.context(req), created_at: new Date() });
      throw new Problem(401, 'INVALID_CREDENTIALS', 'E-mail ou senha inválidos.');
    }
    const session = await this.db.transaction(async (trx) => {
      const now = new Date(); await this.repository.users(trx).where({ id: user.id }).update({ last_login_at: now, updated_at: now });
      await this.repository.events(trx).insert({ user_id: user.id, event_type: 'login_success', ...this.context(req), created_at: now });
      return this.createSession(user, req, trx);
    });
    return { user: toPublicUser(user), ...session };
  }
  async rotate(raw, req) {
    if (!raw) throw new Problem(401, 'SESSION_REQUIRED', 'Sessão de renovação ausente.');
    const result = await this.db.transaction(async (trx) => {
      const current = await this.repository.findRefreshByHash(tokenHash(raw), trx, true);
      if (!current) throw new Problem(401, 'SESSION_INVALID', 'Sessão inválida.');
      if (current.revoked_at) {
        await this.repository.refresh(trx).where({ family_id: current.family_id }).whereNull('revoked_at').update({ revoked_at: new Date() });
        await this.repository.events(trx).insert({ user_id: current.user_id, event_type: 'token_reuse', ...this.context(req), created_at: new Date() });
        return { reuseDetected: true };
      }
      if (new Date(current.expires_at) <= new Date()) throw new Problem(401, 'SESSION_EXPIRED', 'Sessão expirada.');
      const user = await this.repository.users(trx).where({ id: current.user_id, status: 'active' }).first();
      if (!user) throw new Problem(401, 'SESSION_INVALID', 'Sessão inválida.');
      const nextRaw = randomToken(), now = new Date(), expires = new Date(now.getTime() + this.env.REFRESH_TOKEN_TTL_DAYS * 86400000);
      const [nextId] = await this.repository.refresh(trx).insert({ user_id: user.id, family_id: current.family_id, token_hash: tokenHash(nextRaw), expires_at: expires, ...this.context(req), created_at: now });
      await this.repository.refresh(trx).where({ id: current.id }).update({ revoked_at: now, last_used_at: now, replaced_by_id: nextId });
      await this.repository.events(trx).insert({ user_id: user.id, event_type: 'refresh', ...this.context(req), created_at: now });
      return { accessToken: await this.tokens.sign(user), refreshToken: nextRaw, expiresAt: expires };
    });
    if (result.reuseDetected) throw new Problem(401, 'SESSION_REUSED', 'Sessão revogada por segurança.');
    return result;
  }
  async logout(raw, req) {
    if (!raw) return;
    await this.db.transaction(async (trx) => { const token = await this.repository.findRefreshByHash(tokenHash(raw), trx, true); if (token && !token.revoked_at) { await this.repository.refresh(trx).where({ id: token.id }).update({ revoked_at: new Date() }); await this.repository.events(trx).insert({ user_id: token.user_id, event_type: 'logout', ...this.context(req), created_at: new Date() }); } });
  }
  async logoutAll(user) { await this.db.transaction(async (trx) => { const now = new Date(); await this.repository.refresh(trx).where({ user_id: user.id }).whereNull('revoked_at').update({ revoked_at: now }); await this.repository.users(trx).where({ id: user.id }).increment('auth_version', 1).update({ updated_at: now }); }); }
  async reauthenticate(user, password) { if (!await bcrypt.compare(password, user.password_hash)) throw new Problem(401, 'INVALID_CREDENTIALS', 'Senha inválida.'); return this.tokens.sign(user, 'reauth', '5m'); }
  profile(user) { return toPublicUser(user); }
}
