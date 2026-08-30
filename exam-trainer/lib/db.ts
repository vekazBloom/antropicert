import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
mkdirSync(DATA_DIR, { recursive: true });

declare global {
  var __examDb: Database.Database | undefined;
}

function open(): Database.Database {
  const db = new Database(join(DATA_DIR, 'app.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mode           TEXT NOT NULL,          -- 'practice' | 'exam'
      module_id      INTEGER,                -- practice only
      scope          TEXT,                   -- practice only: 'all' | 'unseen' | 'wrong'
      plan           TEXT NOT NULL,          -- JSON [{ q: questionId, o: "CADB" }]
      time_limit_sec INTEGER,                -- NULL = untimed
      started_at     TEXT NOT NULL,
      finished_at    TEXT,
      total          INTEGER NOT NULL,
      correct_count  INTEGER,
      score_pct      REAL,
      passed         INTEGER
    );

    CREATE TABLE IF NOT EXISTS answers (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id  INTEGER NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      selected    TEXT NOT NULL,             -- source letter A-D
      is_correct  INTEGER NOT NULL,
      answered_at TEXT NOT NULL,
      UNIQUE(attempt_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user   ON attempts(user_id, mode);
  `);
  return db;
}

// Next.js dev reloads modules; reuse one handle so WAL locks stay sane.
export const db = globalThis.__examDb ?? open();
if (process.env.NODE_ENV !== 'production') globalThis.__examDb = db;

export type UserRow = { id: number; name: string; created_at: string };

export type AttemptRow = {
  id: number;
  user_id: number;
  mode: 'practice' | 'exam';
  module_id: number | null;
  scope: string | null;
  plan: string;
  time_limit_sec: number | null;
  started_at: string;
  finished_at: string | null;
  total: number;
  correct_count: number | null;
  score_pct: number | null;
  passed: number | null;
};

export type AnswerRow = {
  id: number;
  attempt_id: number;
  question_id: string;
  selected: string;
  is_correct: number;
  answered_at: string;
};
