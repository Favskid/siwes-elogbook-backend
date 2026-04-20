-- Database schema
-- ============================================================
-- SIWES E-LOGBOOK DATABASE SCHEMA
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'student',
  'supervisor',
  'admin'
);

CREATE TYPE entry_status AS ENUM (
  'draft',
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE notification_type AS ENUM (
  'approval',
  'rejection',
  'feedback',
  'submission',
  'info'
);

CREATE TYPE audit_action AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'PURGE'
);


-- ─── TABLE: departments ───────────────────────────────────────
-- Created before users because users.department references it

CREATE TABLE IF NOT EXISTS departments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(20) NOT NULL UNIQUE,
  supervisor_id   UUID,  -- FK added after users table
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABLE: users ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  role            user_role NOT NULL,
  matric_number   VARCHAR(50) UNIQUE,           -- students only
  department      VARCHAR(150),                  -- students + school supervisors
  company         VARCHAR(200),                  -- industry supervisors only
  phone           VARCHAR(20),
  avatar          TEXT,                          -- URL or base64
  supervisor_id   UUID REFERENCES users(id) ON DELETE SET NULL, -- student assignment
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Role-based constraints
  CONSTRAINT student_requires_matric
    CHECK (
      role != 'student' OR matric_number IS NOT NULL
    ),
  CONSTRAINT student_requires_department
    CHECK (
      role != 'student' OR department IS NOT NULL
    ),
  CONSTRAINT supervisor_requires_department
    CHECK (
      role != 'supervisor' OR department IS NOT NULL
    )
);


-- ─── Add FK: departments.supervisor_id -> users ───────────────

ALTER TABLE departments
  ADD CONSTRAINT fk_department_supervisor
  FOREIGN KEY (supervisor_id)
  REFERENCES users(id)
  ON DELETE SET NULL;


-- ─── TABLE: log_entries ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS log_entries (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                  DATE NOT NULL,
  week_number           INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  activity_description  TEXT NOT NULL CHECK (char_length(activity_description) >= 50),
  tools_equipment       TEXT NOT NULL CHECK (char_length(tools_equipment) >= 10),
  skills_acquired       TEXT NOT NULL CHECK (char_length(skills_acquired) >= 10),
  challenges_faced      TEXT NOT NULL CHECK (char_length(challenges_faced) >= 10),
  status                entry_status NOT NULL DEFAULT 'draft',
  supervisor_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  supervisor_comment    TEXT,
  is_deleted            BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A student can only have one entry per date
  CONSTRAINT unique_student_date UNIQUE (student_id, date),

  -- Supervisor comment only allowed when approved or rejected
  CONSTRAINT comment_requires_review
    CHECK (
      supervisor_comment IS NULL OR status IN ('approved', 'rejected')
    )
);


-- ─── TABLE: files ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id      UUID NOT NULL REFERENCES log_entries(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name     VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type     VARCHAR(100) NOT NULL,     -- MIME type e.g. image/png
  file_size     INTEGER NOT NULL,          -- in bytes
  file_path     TEXT NOT NULL,             -- path on disk
  url           TEXT NOT NULL,             -- accessible URL
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABLE: notifications ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  message           TEXT NOT NULL,
  type              notification_type NOT NULL DEFAULT 'info',
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  related_entry_id  UUID REFERENCES log_entries(id) ON DELETE SET NULL,
  related_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABLE: audit_logs ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        audit_action NOT NULL,
  target_table  VARCHAR(100),              -- which table was affected
  target_id     UUID,                      -- which record was affected
  description   TEXT NOT NULL,             -- human-readable action description
  ip_address    VARCHAR(45),               -- supports IPv6
  metadata      JSONB DEFAULT '{}',        -- any extra data
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── TABLE: token_blacklist ───────────────────────────────────
-- For logout: stores invalidated JWT tokens

CREATE TABLE IF NOT EXISTS token_blacklist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token       TEXT NOT NULL UNIQUE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES — for fast lookups on commonly queried columns
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email         ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_matric        ON users(matric_number);
CREATE INDEX IF NOT EXISTS idx_users_supervisor    ON users(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted    ON users(is_deleted);

-- log_entries
CREATE INDEX IF NOT EXISTS idx_entries_student     ON log_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_entries_supervisor  ON log_entries(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_entries_status      ON log_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_week        ON log_entries(week_number);
CREATE INDEX IF NOT EXISTS idx_entries_date        ON log_entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_is_deleted  ON log_entries(is_deleted);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notif_user_id       ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read       ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_type          ON notifications(type);

-- files
CREATE INDEX IF NOT EXISTS idx_files_entry_id      ON files(entry_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by   ON files(uploaded_by);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_admin_id      ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action        ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at    ON audit_logs(created_at);

-- token_blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist     ON token_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_token_expires       ON token_blacklist(expires_at);


-- ============================================================
-- UPDATED_AT AUTO-TRIGGER
-- Automatically updates updated_at on row change
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_log_entries_updated_at
  BEFORE UPDATE ON log_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();