-- CCAO-F Exam Trainer schema.
--
-- Run this once against your Supabase project (SQL Editor -> New query -> paste
-- -> Run), or apply it with `node scripts/init-db.mjs`.
--
-- Only user data lives here. The 757 questions stay in data/questions.json,
-- so the correct answers are never queryable from the client.

CREATE TABLE IF NOT EXISTS users (
  id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profile names are matched case-insensitively, the way SQLite's NOCASE did.
CREATE UNIQUE INDEX IF NOT EXISTS users_name_lower_key ON users (lower(name));

CREATE TABLE IF NOT EXISTS attempts (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode           text        NOT NULL CHECK (mode IN ('practice', 'exam')),
  module_id      integer,                    -- practice only
  scope          text,                       -- practice only: all | unseen | wrong
  plan           jsonb       NOT NULL,       -- [{ q: questionId, o: "CADB" }]
  time_limit_sec integer,                    -- NULL = untimed
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  total          integer     NOT NULL,
  correct_count  integer,
  score_pct      real,
  passed         boolean                     -- exam only
);

CREATE TABLE IF NOT EXISTS answers (
  id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attempt_id  integer     NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id text        NOT NULL,
  selected    text        NOT NULL CHECK (selected IN ('A', 'B', 'C', 'D')),
  is_correct  boolean     NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user   ON attempts (user_id, mode);
