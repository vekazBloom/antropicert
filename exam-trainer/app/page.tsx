import { redirect } from 'next/navigation';
import { ProfilePicker } from '@/components/ProfilePicker';
import { listUsers } from '@/lib/users';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ switch?: string }>;
}) {
  const { switch: forceSwitch } = await searchParams;
  const user = await currentUser();
  if (user && !forceSwitch) redirect('/dashboard');
  return <ProfilePicker users={await listUsers()} />;
}
