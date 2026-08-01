ALTER TABLE users
  ADD COLUMN plan_code ENUM('free','premium') NOT NULL DEFAULT 'free' AFTER locale,
  ADD COLUMN deleted_at DATETIME(3) NULL AFTER last_login_at;

ALTER TABLE habits
  ADD COLUMN category VARCHAR(80) NULL AFTER description,
  ADD COLUMN reminder_time TIME NULL AFTER icon;

ALTER TABLE habit_checkins
  ADD COLUMN duration_minutes INT UNSIGNED NULL AFTER completed_at;

ALTER TABLE cognitive_journal_entries
  ADD COLUMN body TEXT NULL AFTER title,
  ADD COLUMN mood VARCHAR(80) NULL AFTER body,
  ADD COLUMN ai_analysis JSON NULL AFTER outcome;

CREATE TABLE plans (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL,
 user_id BIGINT UNSIGNED NOT NULL, plan_date DATE NOT NULL,
 status ENUM('draft','active','completed','archived') NOT NULL DEFAULT 'active',
 content_json JSON, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_plans_public(public_id), UNIQUE KEY uq_plans_user_date(user_id,plan_date),
 KEY ix_plans_user_status_date(user_id,status,plan_date),
 CONSTRAINT fk_plans_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE telemetry_snapshots (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, public_id CHAR(36) CHARACTER SET ascii NOT NULL,
 user_id BIGINT UNSIGNED NOT NULL, period_start DATE NOT NULL, period_end DATE NOT NULL,
 stats_json JSON NOT NULL, created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
 UNIQUE KEY uq_telemetry_public(public_id), KEY ix_telemetry_user_period(user_id,period_start,period_end),
 CONSTRAINT fk_telemetry_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO emotions (code,name,default_valence,is_active,display_order,created_at,updated_at) VALUES
('feliz','Feliz',2,TRUE,1,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('triste','Triste',-2,TRUE,2,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('ansioso','Ansioso',-1,TRUE,3,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('motivado','Motivado',2,TRUE,4,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('desanimado','Desanimado',-2,TRUE,5,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('estressado','Estressado',-1,TRUE,6,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('calmo','Calmo',1,TRUE,7,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3)),
('outra','Outra',0,TRUE,8,UTC_TIMESTAMP(3),UTC_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE name=VALUES(name), default_valence=VALUES(default_valence),
is_active=VALUES(is_active), display_order=VALUES(display_order), updated_at=VALUES(updated_at);
