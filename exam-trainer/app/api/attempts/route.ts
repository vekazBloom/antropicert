import { NextResponse } from 'next/server';
import { createAttempt, listAttempts, runPayload } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'no profile selected' }, { status: 401 });
  return NextResponse.json({ attempts: await listAttempts(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'no profile selected' }, { status: 401 });
  try {
    const body = await req.json();
    const attempt = await createAttempt({
      userId: user.id,
      mode: body.mode === 'exam' ? 'exam' : 'practice',
      moduleId: body.moduleId ? Number(body.moduleId) : undefined,
      scope: body.scope,
      shuffleQuestions: Boolean(body.shuffleQuestions),
      shuffleOptions: body.shuffleOptions !== false,
      timeLimitSec: body.timeLimitSec ? Number(body.timeLimitSec) : null,
    });
    return NextResponse.json(await runPayload(attempt));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
