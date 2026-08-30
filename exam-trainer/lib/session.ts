import { cookies } from 'next/headers';
import { getUser } from '@/lib/users';
import type { UserRow } from '@/lib/db';

export const USER_COOKIE = 'ccaof_user';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
};

export async function currentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isFinite(id)) return null;
  return (await getUser(id)) ?? null;
}
