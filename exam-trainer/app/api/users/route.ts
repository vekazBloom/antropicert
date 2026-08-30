import { NextResponse } from 'next/server';
import { createUser, listUsers } from '@/lib/users';
import { USER_COOKIE } from '@/lib/session';

export async function GET() {
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = createUser(String(body?.name ?? ''));
    const res = NextResponse.json({ user });
    res.cookies.set(USER_COOKIE, String(user.id), {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
