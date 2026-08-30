import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { PracticeStart } from '@/components/PracticeStart';
import { MODULE_BY_ID } from '@/data/modules';
import { QUESTIONS_BY_MODULE } from '@/lib/questions';
import { currentUser } from '@/lib/session';
import { moduleHistory } from '@/lib/users';

export const dynamic = 'force-dynamic';

export default async function PracticePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const id = Number(moduleId);
  const mod = MODULE_BY_ID.get(id);
  if (!mod) notFound();

  const user = await currentUser();
  if (!user) redirect('/');

  const bank = QUESTIONS_BY_MODULE.get(id)!;
  const { seen, wrong } = await moduleHistory(user.id, id);

  return (
    <>
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
        <PracticeStart
          module={mod}
          total={bank.length}
          unseen={bank.length - seen.size}
          wrong={wrong.size}
        />
      </main>
    </>
  );
}
