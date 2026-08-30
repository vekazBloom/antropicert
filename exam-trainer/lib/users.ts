import { sql, toUser, type UserRow } from '@/lib/db';

export async function listUsers(): Promise<UserRow[]> {
  const rows = await sql`SELECT * FROM users ORDER BY lower(name)`;
  return rows.map(toUser);
}

export async function getUser(id: number): Promise<UserRow | undefined> {
  if (!Number.isFinite(id)) return undefined;
  const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
  return rows.length ? toUser(rows[0]) : undefined;
}

export async function createUser(name: string): Promise<UserRow> {
  const clean = name.trim();
  if (!clean) throw new Error('name is required');
  if (clean.length > 40) throw new Error('name is too long');

  const existing = await sql`SELECT * FROM users WHERE lower(name) = lower(${clean})`;
  if (existing.length) return toUser(existing[0]);

  const rows = await sql`INSERT INTO users (name) VALUES (${clean}) RETURNING *`;
  return toUser(rows[0]);
}

export type ModuleProgress = {
  moduleId: number;
  answered: number;
  correct: number;
  wrong: number;
};

/** Per-module coverage for a user, counting each question once at its best result. */
export async function moduleProgress(userId: number): Promise<Map<number, ModuleProgress>> {
  const rows = (await sql`
    SELECT a.question_id AS qid, bool_or(a.is_correct) AS ever_right
      FROM answers a
      JOIN attempts t ON t.id = a.attempt_id
     WHERE t.user_id = ${userId}
     GROUP BY a.question_id
  `) as unknown as { qid: string; ever_right: boolean }[];

  const out = new Map<number, ModuleProgress>();
  for (const r of rows) {
    const moduleId = Number(r.qid.slice(1, r.qid.indexOf('-')));
    const e = out.get(moduleId) ?? { moduleId, answered: 0, correct: 0, wrong: 0 };
    e.answered += 1;
    if (r.ever_right) e.correct += 1;
    else e.wrong += 1;
    out.set(moduleId, e);
  }
  return out;
}

/** Question ids in one module the user has already seen, and which they got wrong. */
export async function moduleHistory(userId: number, moduleId: number) {
  const rows = (await sql`
    SELECT a.question_id AS qid, bool_or(a.is_correct) AS ever_right
      FROM answers a
      JOIN attempts t ON t.id = a.attempt_id
     WHERE t.user_id = ${userId}
       AND a.question_id LIKE ${'m' + moduleId + '-%'}
     GROUP BY a.question_id
  `) as unknown as { qid: string; ever_right: boolean }[];

  const seen = new Set<string>();
  const wrong = new Set<string>();
  for (const r of rows) {
    seen.add(r.qid);
    if (!r.ever_right) wrong.add(r.qid);
  }
  return { seen, wrong };
}
