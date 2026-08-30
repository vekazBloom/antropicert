import { NextResponse } from 'next/server';
import { db, type AttemptRow } from '@/lib/db';
import { createAttempt, runPayload } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'no profile selected' }, { status: 401 });
  const rows = db
    .prepare(
      `SELECT id, mode, module_id, scope, time_limit_sec, started_at, finished_at,
              total, correct_count, score_pct, passed
         FROM attempts
        WHERE user_id = ?
        ORDER BY id DESC`
    )
    .all(user.id) as AttemptRow[];
  return NextResponse.json({ attempts: rows });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'no profile selected' }, { status: 401 });
  try {
    const body = await req.json();
    const attempt = createAttempt({
      userId: user.id,
      mode: body.mode === 'exam' ? 'exam' : 'practice',
      moduleId: body.moduleId ? Number(body.moduleId) : undefined,
      scope: body.scope,
      shuffleQuestions: Boolean(body.shuffleQuestions),
      shuffleOptions: body.shuffleOptions !== false,
      timeLimitSec: body.timeLimitSec ? Number(body.timeLimitSec) : null,
    });
    return NextResponse.json(runPayload(attempt));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
