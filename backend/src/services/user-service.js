import bcrypt from 'bcrypt';
import { Problem } from '../utils/problem.js';
import { toPublicUser, now } from '../utils/domain.js';

export class UserService {
  constructor({ db, env }) {
    this.db = db;
    this.env = env;
  }

  profile(user) {
    return toPublicUser(user);
  }

  async updateProfile(user, input) {
    const changes = {};
    for (const key of ['name', 'timezone', 'locale']) {
      if (input[key] !== undefined) changes[key] = input[key];
    }
    if (!Object.keys(changes).length) return this.profile(user);
    changes.updated_at = now();
    await this.db('users').where({ id: user.id }).update(changes);
    const updated = await this.db('users').where({ id: user.id }).first();
    return this.profile(updated);
  }

  async changePassword(user, input) {
    const valid = await bcrypt.compare(input.currentPassword, user.password_hash);
    if (!valid) throw new Problem(401, 'INVALID_CREDENTIALS', 'Senha atual invalida.');
    const passwordHash = await bcrypt.hash(input.newPassword, this.env.BCRYPT_ROUNDS);
    await this.db.transaction(async (trx) => {
      const changedAt = now();
      await trx('users').where({ id: user.id }).increment('auth_version', 1).update({
        password_hash: passwordHash,
        password_changed_at: changedAt,
        updated_at: changedAt,
      });
      await trx('refresh_tokens').where({ user_id: user.id }).whereNull('revoked_at').update({ revoked_at: changedAt });
      await trx('auth_events').insert({ user_id: user.id, event_type: 'password_changed', created_at: changedAt });
    });
  }

  async deleteAccount(user, input) {
    const valid = await bcrypt.compare(input.password, user.password_hash);
    if (!valid) throw new Problem(401, 'INVALID_CREDENTIALS', 'Senha invalida.');

    await this.db.transaction(async (trx) => {
      const eventIds = trx('emotional_events').select('id').where({ user_id: user.id });
      const scheduleIds = trx('habit_schedule_versions').select('id').where({ user_id: user.id });

      await trx('ai_insights').where({ user_id: user.id }).del();
      await trx('emotional_event_items').whereIn('event_id', eventIds).del();
      await trx('emotional_events').where({ user_id: user.id }).del();
      await trx('habit_checkins').where({ user_id: user.id }).del();
      await trx('habit_schedule_weekdays').whereIn('schedule_version_id', scheduleIds).del();
      await trx('habit_schedule_versions').where({ user_id: user.id }).del();
      await trx('habits').where({ user_id: user.id }).del();
      await trx('cognitive_journal_entries').where({ user_id: user.id }).del();
      await trx('telemetry_snapshots').where({ user_id: user.id }).del();
      await trx('plans').where({ user_id: user.id }).del();
      await trx('password_reset_tokens').where({ user_id: user.id }).del();
      await trx('refresh_tokens').where({ user_id: user.id }).del();
      await trx('user_consent_events').where({ user_id: user.id }).del();
      await trx('auth_events').where({ user_id: user.id }).del();
      await trx('users').where({ id: user.id }).del();
    });
  }

  async listConsents(user) {
    const rows = await this.db('user_consent_events').where({ user_id: user.id }).orderBy('occurred_at', 'desc').orderBy('id', 'desc');
    return rows.map((row) => ({
      id: row.id,
      type: row.consent_type,
      documentVersion: row.document_version,
      action: row.action,
      occurredAt: row.occurred_at,
      createdAt: row.created_at,
    }));
  }

  async addConsentEvent(user, input) {
    const createdAt = now();
    const [id] = await this.db('user_consent_events').insert({
      user_id: user.id,
      consent_type: input.type,
      document_version: input.documentVersion,
      action: input.action,
      occurred_at: createdAt,
      created_at: createdAt,
    });
    const [event] = await this.db('user_consent_events').where({ id });
    return {
      id: event.id,
      type: event.consent_type,
      documentVersion: event.document_version,
      action: event.action,
      occurredAt: event.occurred_at,
      createdAt: event.created_at,
    };
  }

  async hasActiveConsent(user, type) {
    const event = await this.db('user_consent_events')
      .where({ user_id: user.id, consent_type: type })
      .orderBy('occurred_at', 'desc')
      .orderBy('id', 'desc')
      .first();
    return event?.action === 'granted';
  }
}
