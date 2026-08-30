import { notFound, redirect } from 'next/navigation';
import { AppHeader } from '@/components/AppHeader';
import { PracticeStart } from '@/components/PracticeStart';
import { MODULE_BY_ID } from '@/data/modules';
import { QUESTIONS_BY_MODULE } from '@/lib/questions';
import { currentUser } from '@/lib/session';
import { db } from '@/lib/db';

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
  const rows = db
    .prepare(
      `SELECT a.question_id AS qid, MAX(a.is_correct) AS ever_right
         FROM answers a JOIN attempts t ON t.id = a.attempt_id
        WHERE t.user_id = ? GROUP BY a.question_id`
    )
    .all(user.id) as { qid: string; ever_right: number }[];

  const seen = new Set<string>();
  const wrong = new Set<string>();
  for (const r of rows) {
    if (!r.qid.startsWith(`m${id}-`)) continue;
    seen.add(r.qid);
    if (r.ever_right === 0) wrong.add(r.qid);
  }

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
