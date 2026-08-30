import { NextResponse } from 'next/server';
import { getAttempt, runPayload } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await currentUser();
  const attempt = await getAttempt(Number(id));
  if (!attempt || !user || attempt.user_id !== user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json(await runPayload(attempt));
}
