import { NextResponse } from 'next/server';
import { createUser, listUsers } from '@/lib/users';
import { COOKIE_OPTIONS, USER_COOKIE } from '@/lib/session';

export async function GET() {
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user = await createUser(String(body?.name ?? ''));
    const res = NextResponse.json({ user });
    res.cookies.set(USER_COOKIE, String(user.id), COOKIE_OPTIONS);
    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
