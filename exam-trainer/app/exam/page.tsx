import { redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ExamStart } from '@/components/ExamStart';
import { allocate } from '@/lib/examBuilder';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ExamPage() {
  const user = await currentUser();
  if (!user) redirect('/');

  const perModule = [...allocate().entries()].map(([moduleId, count]) => ({ moduleId, count }));

  return (
    <>
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <ExamStart perModule={perModule} />
      </main>
    </>
  );
}
