SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE users (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL,
 name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL, password_hash VARCHAR(255) NOT NULL,
 timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo', locale VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
 status ENUM('active','blocked') NOT NULL DEFAULT 'active', auth_version INT UNSIGNED NOT NULL DEFAULT 1,
 password_changed_at DATETIME(3) NOT NULL, last_login_at DATETIME(3), created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_users_public_id(public_id), UNIQUE KEY uq_users_email(email), KEY ix_users_status(status), KEY ix_users_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_consent_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
 consent_type ENUM('terms','privacy','ai_processing') NOT NULL, document_version VARCHAR(30) NOT NULL,
 action ENUM('granted','revoked') NOT NULL, occurred_at DATETIME(3) NOT NULL, created_at DATETIME(3) NOT NULL,
 KEY ix_consents_user_type_time(user_id,consent_type,occurred_at,id),
 CONSTRAINT fk_consents_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE refresh_tokens (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL,
 family_id CHAR(36) CHARACTER SET ascii NOT NULL, token_hash CHAR(64) CHARACTER SET ascii NOT NULL,
 expires_at DATETIME(3) NOT NULL, revoked_at DATETIME(3), replaced_by_id BIGINT UNSIGNED, last_used_at DATETIME(3),
 user_agent VARCHAR(255), ip_hmac CHAR(64) CHARACTER SET ascii, created_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_refresh_hash(token_hash), KEY ix_refresh_family(family_id), KEY ix_refresh_user_state(user_id,revoked_at,expires_at),
 CONSTRAINT fk_refresh_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 CONSTRAINT fk_refresh_replaced FOREIGN KEY(replaced_by_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE password_reset_tokens (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, token_hash CHAR(64) CHARACTER SET ascii NOT NULL,
 expires_at DATETIME(3) NOT NULL, used_at DATETIME(3), requested_ip_hmac CHAR(64) CHARACTER SET ascii, created_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_password_reset_hash(token_hash), KEY ix_password_reset_user(user_id,expires_at,used_at),
 CONSTRAINT fk_password_reset_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE auth_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id BIGINT UNSIGNED, event_type VARCHAR(40) NOT NULL,
 ip_hmac CHAR(64) CHARACTER SET ascii, user_agent VARCHAR(255), metadata JSON, created_at DATETIME(3) NOT NULL,
 KEY ix_auth_event_user(user_id,created_at), KEY ix_auth_event_type(event_type,created_at),
 CONSTRAINT fk_auth_event_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE habits (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(120) NOT NULL, description VARCHAR(500), color CHAR(7) CHARACTER SET ascii, icon VARCHAR(50), start_date DATE NOT NULL,
 end_date DATE, status ENUM('active','archived') NOT NULL DEFAULT 'active', archived_at DATETIME(3), created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_habits_public(public_id), UNIQUE KEY uq_habits_id_user(id,user_id), KEY ix_habits_user_status(user_id,status), KEY ix_habits_user_dates(user_id,start_date,end_date),
 CONSTRAINT fk_habits_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT ck_habits_dates CHECK(end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE habit_schedule_versions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, habit_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, effective_from DATE NOT NULL, effective_to DATE,
 frequency_type ENUM('daily','specific_weekdays','weekly_target') NOT NULL, weekly_target TINYINT UNSIGNED,
 target_value DECIMAL(10,2) NOT NULL DEFAULT 1, unit VARCHAR(30), created_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_schedule_start(habit_id,effective_from), UNIQUE KEY uq_schedule_habit_user(id,habit_id,user_id),
 CONSTRAINT fk_schedule_habit_user FOREIGN KEY(habit_id,user_id) REFERENCES habits(id,user_id) ON DELETE RESTRICT,
 CONSTRAINT ck_schedule_dates CHECK(effective_to IS NULL OR effective_to >= effective_from),
 CONSTRAINT ck_schedule_target CHECK(target_value > 0),
 CONSTRAINT ck_schedule_weekly CHECK((frequency_type='weekly_target' AND weekly_target BETWEEN 1 AND 7) OR (frequency_type<>'weekly_target' AND weekly_target IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE habit_schedule_weekdays (
 schedule_version_id BIGINT UNSIGNED NOT NULL, weekday TINYINT UNSIGNED NOT NULL,
 PRIMARY KEY(schedule_version_id,weekday), CONSTRAINT ck_weekday CHECK(weekday BETWEEN 1 AND 7),
 CONSTRAINT fk_weekday_schedule FOREIGN KEY(schedule_version_id) REFERENCES habit_schedule_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE habit_checkins (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL, habit_id BIGINT UNSIGNED NOT NULL,
 schedule_version_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL, checkin_date DATE NOT NULL, progress_value DECIMAL(10,2) NOT NULL,
 target_snapshot DECIMAL(10,2) NOT NULL, status ENUM('in_progress','completed','skipped') NOT NULL,
 note VARCHAR(500), completed_at DATETIME(3), created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_checkin_public(public_id), UNIQUE KEY uq_checkin_id_user(id,user_id), UNIQUE KEY uq_checkin_day(habit_id,checkin_date),
 KEY ix_checkin_habit_status_date(habit_id,status,checkin_date), KEY ix_checkin_schedule(schedule_version_id), KEY ix_checkin_date_status(checkin_date,status),
 CONSTRAINT fk_checkin_habit_user FOREIGN KEY(habit_id,user_id) REFERENCES habits(id,user_id) ON DELETE RESTRICT,
 CONSTRAINT fk_checkin_schedule_habit_user FOREIGN KEY(schedule_version_id,habit_id,user_id) REFERENCES habit_schedule_versions(id,habit_id,user_id) ON DELETE RESTRICT,
 CONSTRAINT ck_checkin_progress CHECK(progress_value >= 0), CONSTRAINT ck_checkin_target CHECK(target_snapshot > 0),
 CONSTRAINT ck_checkin_completion CHECK((status='completed' AND completed_at IS NOT NULL) OR (status<>'completed' AND completed_at IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE emotions (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) NOT NULL, name VARCHAR(80) NOT NULL,
 default_valence SMALLINT NOT NULL, is_active BOOLEAN NOT NULL DEFAULT TRUE, display_order INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL, UNIQUE KEY uq_emotions_code(code),
 CONSTRAINT ck_emotions_valence CHECK(default_valence BETWEEN -2 AND 2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cognitive_journal_entries (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(150), occurred_at DATETIME(3) NOT NULL, status ENUM('draft','completed') NOT NULL DEFAULT 'draft', situation TEXT,
 automatic_thoughts TEXT, evidence_for TEXT, evidence_against TEXT, alternative_thought TEXT, behavioral_response TEXT, outcome TEXT,
 last_saved_at DATETIME(3) NOT NULL, lock_version INT UNSIGNED NOT NULL DEFAULT 0, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_journal_public(public_id), UNIQUE KEY uq_journal_id_user(id,user_id), KEY ix_journal_user_occurred(user_id,occurred_at), KEY ix_journal_user_status_updated(user_id,status,updated_at),
 CONSTRAINT fk_journal_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE emotional_events (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 source_type ENUM('standalone','habit_checkin','cognitive_journal') NOT NULL, habit_checkin_id BIGINT UNSIGNED,
 cognitive_journal_entry_id BIGINT UNSIGNED, valence SMALLINT NOT NULL, energy TINYINT UNSIGNED NOT NULL, note VARCHAR(500),
 occurred_at DATETIME(3) NOT NULL, local_date DATE NOT NULL, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_event_public(public_id), UNIQUE KEY uq_event_checkin(habit_checkin_id), UNIQUE KEY uq_event_journal(cognitive_journal_entry_id),
 KEY ix_event_user_date(user_id,local_date), KEY ix_event_user_occurred(user_id,occurred_at), KEY ix_event_user_source_date(user_id,source_type,local_date),
 CONSTRAINT fk_event_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_event_checkin_user FOREIGN KEY(habit_checkin_id,user_id) REFERENCES habit_checkins(id,user_id) ON DELETE CASCADE,
 CONSTRAINT fk_event_journal_user FOREIGN KEY(cognitive_journal_entry_id,user_id) REFERENCES cognitive_journal_entries(id,user_id) ON DELETE CASCADE,
 CONSTRAINT ck_event_valence CHECK(valence BETWEEN -2 AND 2), CONSTRAINT ck_event_energy CHECK(energy BETWEEN 1 AND 5),
 CONSTRAINT ck_event_source CHECK((source_type='standalone' AND habit_checkin_id IS NULL AND cognitive_journal_entry_id IS NULL) OR (source_type='habit_checkin' AND habit_checkin_id IS NOT NULL AND cognitive_journal_entry_id IS NULL) OR (source_type='cognitive_journal' AND habit_checkin_id IS NULL AND cognitive_journal_entry_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE emotional_event_items (
 event_id BIGINT UNSIGNED NOT NULL, emotion_id BIGINT UNSIGNED NOT NULL, intensity TINYINT UNSIGNED NOT NULL,
 resulting_intensity TINYINT UNSIGNED, is_primary BOOLEAN NOT NULL DEFAULT FALSE,
 PRIMARY KEY(event_id,emotion_id),
 CONSTRAINT fk_item_event FOREIGN KEY(event_id) REFERENCES emotional_events(id) ON DELETE CASCADE,
 CONSTRAINT fk_item_emotion FOREIGN KEY(emotion_id) REFERENCES emotions(id) ON DELETE RESTRICT,
 CONSTRAINT ck_item_intensity CHECK(intensity BETWEEN 1 AND 5),
 CONSTRAINT ck_item_result CHECK(resulting_intensity IS NULL OR resulting_intensity BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ai_insights (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 insight_type ENUM('habit_coaching','journal_reflection','emotional_summary') NOT NULL, habit_id BIGINT UNSIGNED,
 cognitive_journal_entry_id BIGINT UNSIGNED, period_start DATE, period_end DATE, status ENUM('completed','failed','blocked') NOT NULL,
 provider VARCHAR(30) NOT NULL, model_id VARCHAR(100) NOT NULL, prompt_version VARCHAR(30) NOT NULL, content_json JSON,
 safety_level ENUM('normal','sensitive','crisis') NOT NULL, input_hash CHAR(64) CHARACTER SET ascii NOT NULL,
 idempotency_key VARCHAR(100) NOT NULL, prompt_tokens INT UNSIGNED, completion_tokens INT UNSIGNED, latency_ms INT UNSIGNED, error_code VARCHAR(50),
 created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL, completed_at DATETIME(3),
 UNIQUE KEY uq_insight_public(public_id), UNIQUE KEY uq_insight_idempotency(user_id,idempotency_key), KEY ix_insight_user_type_created(user_id,insight_type,created_at),
 CONSTRAINT fk_insight_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE RESTRICT,
 CONSTRAINT fk_insight_habit_user FOREIGN KEY(habit_id,user_id) REFERENCES habits(id,user_id) ON DELETE CASCADE,
 CONSTRAINT fk_insight_journal_user FOREIGN KEY(cognitive_journal_entry_id,user_id) REFERENCES cognitive_journal_entries(id,user_id) ON DELETE CASCADE,
 CONSTRAINT ck_insight_period CHECK(period_end IS NULL OR period_start IS NOT NULL AND period_end >= period_start),
 CONSTRAINT ck_insight_source CHECK(
   (insight_type='habit_coaching' AND habit_id IS NOT NULL AND cognitive_journal_entry_id IS NULL AND period_start IS NULL AND period_end IS NULL) OR
   (insight_type='journal_reflection' AND habit_id IS NULL AND cognitive_journal_entry_id IS NOT NULL AND period_start IS NULL AND period_end IS NULL) OR
   (insight_type='emotional_summary' AND habit_id IS NULL AND cognitive_journal_entry_id IS NULL AND period_start IS NOT NULL AND period_end IS NOT NULL)
 )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

