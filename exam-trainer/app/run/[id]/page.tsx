import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { ExamRunner } from '@/components/ExamRunner';
import { PracticeRunner } from '@/components/PracticeRunner';
import { MODULE_BY_ID } from '@/data/modules';
import { getAttempt, runPayload } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect('/');

  const attempt = await getAttempt(Number(id));
  if (!attempt || attempt.user_id !== user.id) notFound();
  if (attempt.finished_at) redirect(`/results/${attempt.id}`);

  const payload = await runPayload(attempt);
  const mod = attempt.module_id ? MODULE_BY_ID.get(attempt.module_id) : null;

  return (
    <>
      <AppHeader userName={user.name} />
      <main
        className={`mx-auto w-full flex-1 px-6 py-8 ${
          attempt.mode === 'exam' ? 'max-w-5xl' : 'max-w-2xl'
        }`}
      >
        {mod && (
          <p className="mb-4 text-xs font-semibold tracking-wide text-accent uppercase">
            Module {mod.id} &middot; {mod.title}
          </p>
        )}
        {attempt.mode === 'exam' ? (
          <ExamRunner payload={payload} />
        ) : (
          <PracticeRunner payload={payload} />
        )}
      </main>
    </>
  );
}
