import { NextResponse } from 'next/server';
import { getAttempt, recordAnswer } from '@/lib/attempts';
import { currentUser } from '@/lib/session';
import type { Letter } from '@/lib/questions';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  const attempt = await getAttempt(Number(id));
  if (!attempt || !user || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  try {
    const body = await req.json();
    const result = await recordAnswer(
      attempt,
      String(body.questionId),
      String(body.selected) as Letter
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
