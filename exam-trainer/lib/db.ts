import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env.local and paste your ' +
      'Supabase connection string (Project Settings -> Database -> Connection ' +
      'string -> Transaction pooler).'
  );
}

declare global {
  var __examSql: ReturnType<typeof postgres> | undefined;
}

function connect() {
  return postgres(connectionString!, {
    // Supabase's transaction pooler does not support prepared statements, and
    // serverless functions should not hold a pool open.
    prepare: false,
    max: 1,
    idle_timeout: 20,
    connect_timeout: 15,
  });
}

// Next.js reloads modules in dev; reuse one client so connections don't pile up.
export const sql = globalThis.__examSql ?? connect();
if (process.env.NODE_ENV !== 'production') globalThis.__examSql = sql;

export type UserRow = { id: number; name: string; created_at: string };

export type AttemptRow = {
  id: number;
  user_id: number;
  mode: 'practice' | 'exam';
  module_id: number | null;
  scope: string | null;
  plan: { q: string; o: string }[];
  time_limit_sec: number | null;
  started_at: string;
  finished_at: string | null;
  total: number;
  correct_count: number | null;
  score_pct: number | null;
  passed: boolean | null;
};

export type AnswerRow = {
  id: number;
  attempt_id: number;
  question_id: string;
  selected: string;
  is_correct: boolean;
  answered_at: string;
};

/**
 * Postgres hands back `Date` objects for timestamptz. Everything downstream —
 * the client payloads, the date formatting — expects ISO strings, so timestamps
 * are normalised here at the boundary rather than in a dozen call sites.
 */
function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function toUser(row: any): UserRow {
  return { id: row.id, name: row.name, created_at: iso(row.created_at)! };
}

export function toAttempt(row: any): AttemptRow {
  return {
    id: row.id,
    user_id: row.user_id,
    mode: row.mode,
    module_id: row.module_id,
    scope: row.scope,
    plan: row.plan,
    time_limit_sec: row.time_limit_sec,
    started_at: iso(row.started_at)!,
    finished_at: iso(row.finished_at),
    total: row.total,
    correct_count: row.correct_count,
    score_pct: row.score_pct,
    passed: row.passed,
  };
}

export function toAnswer(row: any): AnswerRow {
  return {
    id: row.id,
    attempt_id: row.attempt_id,
    question_id: row.question_id,
    selected: row.selected,
    is_correct: row.is_correct,
    answered_at: iso(row.answered_at)!,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
