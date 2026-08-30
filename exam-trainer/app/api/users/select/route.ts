import { NextResponse } from 'next/server';
import { getUser } from '@/lib/users';
import { USER_COOKIE } from '@/lib/session';

/** Switches the active profile by setting the cookie server-side. */
export async function POST(req: Request) {
  const body = await req.json();
  const user = getUser(Number(body?.userId));
  if (!user) return NextResponse.json({ error: 'no such profile' }, { status: 404 });
  const res = NextResponse.json({ user });
  res.cookies.set(USER_COOKIE, String(user.id), {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
