import { NextResponse } from 'next/server';
import { buildReview, finishAttempt, getAttempt } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  const attempt = getAttempt(Number(id));
  if (!attempt || !user || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const finished = finishAttempt(attempt);
  return NextResponse.json({ review: buildReview(finished) });
}
