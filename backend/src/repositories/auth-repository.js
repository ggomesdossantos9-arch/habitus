export class AuthRepository {
  constructor(db) { this.db = db; }
  users(q = this.db) { return q('users'); }
  refresh(q = this.db) { return q('refresh_tokens'); }
  events(q = this.db) { return q('auth_events'); }
  consents(q = this.db) { return q('user_consent_events'); }
  findUserByEmail(email, q = this.db) { return this.users(q).where({ email }).first(); }
  findUserByPublicId(publicId, q = this.db) { return this.users(q).where({ public_id: publicId }).first(); }
  findRefreshByHash(hash, q = this.db, lock = false) { const query = this.refresh(q).where({ token_hash: hash }).first(); return lock ? query.forUpdate() : query; }
}
