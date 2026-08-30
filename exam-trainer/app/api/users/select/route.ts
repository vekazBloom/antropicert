import { NextResponse } from 'next/server';
import { getUser } from '@/lib/users';
import { COOKIE_OPTIONS, USER_COOKIE } from '@/lib/session';

/** Switches the active profile by setting the cookie server-side. */
export async function POST(req: Request) {
  const body = await req.json();
  const user = await getUser(Number(body?.userId));
  if (!user) return NextResponse.json({ error: 'no such profile' }, { status: 404 });
  const res = NextResponse.json({ user });
  res.cookies.set(USER_COOKIE, String(user.id), COOKIE_OPTIONS);
  return res;
}
