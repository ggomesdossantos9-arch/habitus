import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export async function up(knex) {
  const sql = await fs.readFile(path.resolve(here, './202606220001_initial_schema.sql'), 'utf8');
  for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean)) await knex.raw(statement);
}
export async function down(knex) {
  await knex.raw('SET FOREIGN_KEY_CHECKS=0');
  try {
    for (const table of ['ai_insights','emotional_event_items','emotional_events','cognitive_journal_entries','emotions','habit_checkins','habit_schedule_weekdays','habit_schedule_versions','habits','auth_events','password_reset_tokens','refresh_tokens','user_consent_events','users']) await knex.schema.dropTableIfExists(table);
  } finally {
    await knex.raw('SET FOREIGN_KEY_CHECKS=1');
  }
}
