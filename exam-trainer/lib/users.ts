import { db, type UserRow } from '@/lib/db';

export function listUsers(): UserRow[] {
  return db.prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE').all() as UserRow[];
}

export function getUser(id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function createUser(name: string): UserRow {
  const clean = name.trim();
  if (!clean) throw new Error('name is required');
  if (clean.length > 40) throw new Error('name is too long');
  const existing = db
    .prepare('SELECT * FROM users WHERE name = ? COLLATE NOCASE')
    .get(clean) as UserRow | undefined;
  if (existing) return existing;
  const info = db
    .prepare('INSERT INTO users (name, created_at) VALUES (?, ?)')
    .run(clean, new Date().toISOString());
  return getUser(Number(info.lastInsertRowid))!;
}

export type ModuleProgress = {
  moduleId: number;
  answered: number;
  correct: number;
  wrong: number;
};

/** Per-module coverage for a user, counting each question once at its best result. */
export function moduleProgress(userId: number): Map<number, ModuleProgress> {
  const rows = db
    .prepare(
      `SELECT a.question_id AS qid, MAX(a.is_correct) AS ever_right
         FROM answers a
         JOIN attempts t ON t.id = a.attempt_id
        WHERE t.user_id = ?
        GROUP BY a.question_id`
    )
    .all(userId) as { qid: string; ever_right: number }[];

  const out = new Map<number, ModuleProgress>();
  for (const r of rows) {
    const moduleId = Number(r.qid.slice(1, r.qid.indexOf('-')));
    const e = out.get(moduleId) ?? { moduleId, answered: 0, correct: 0, wrong: 0 };
    e.answered += 1;
    if (r.ever_right === 1) e.correct += 1;
    else e.wrong += 1;
    out.set(moduleId, e);
  }
  return out;
}
