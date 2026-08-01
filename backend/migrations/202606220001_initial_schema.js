import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

function isForeignKeyFailure(error) {
  return error?.code === 'ER_CANNOT_ADD_FOREIGN' || /foreign key constraint/i.test(error?.message || '');
}

async function createEmotionalEventItemsFallback(knex) {
  if (await knex.schema.hasTable('emotional_event_items')) return;

  await knex.raw(`CREATE TABLE emotional_event_items (
 event_id BIGINT UNSIGNED NOT NULL, emotion_id BIGINT UNSIGNED NOT NULL, intensity TINYINT UNSIGNED NOT NULL,
 resulting_intensity TINYINT UNSIGNED, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 PRIMARY KEY(event_id,emotion_id), KEY ix_items_event(event_id), KEY ix_items_emotion(emotion_id),
 CONSTRAINT ck_item_intensity CHECK(intensity BETWEEN 1 AND 5),
 CONSTRAINT ck_item_result CHECK(resulting_intensity IS NULL OR resulting_intensity BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
}

export async function up(knex) {
  const sql = await fs.readFile(path.resolve(here, './202606220001_initial_schema.sql'), 'utf8');
  for (const statement of sql.split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean)) {
    try {
      await knex.raw(statement);
    } catch (error) {
      if (/^CREATE TABLE emotional_event_items/i.test(statement) && isForeignKeyFailure(error)) {
        await createEmotionalEventItemsFallback(knex);
        continue;
      }
      if (error?.code !== 'ER_TABLE_EXISTS_ERROR') throw error;
    }
  }
}
export async function down(knex) {
  await knex.raw('SET FOREIGN_KEY_CHECKS=0');
  try {
    for (const table of ['ai_insights','emotional_event_items','emotional_events','cognitive_journal_entries','emotions','habit_checkins','habit_schedule_weekdays','habit_schedule_versions','habits','auth_events','password_reset_tokens','refresh_tokens','user_consent_events','users']) await knex.schema.dropTableIfExists(table);
  } finally {
    await knex.raw('SET FOREIGN_KEY_CHECKS=1');
  }
}
