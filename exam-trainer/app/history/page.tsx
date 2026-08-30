import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Inbox, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Pill, formatDate, formatDuration, formatPct } from '@/components/ui';
import { MODULE_BY_ID } from '@/data/modules';
import { db, type AttemptRow } from '@/lib/db';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const user = await currentUser();
  if (!user) redirect('/');

  const attempts = db
    .prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY id DESC')
    .all(user.id) as AttemptRow[];

  return (
    <>
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <h1 className="mb-1 text-xl font-semibold">Your attempts</h1>
        <p className="mb-6 text-sm text-muted">
          Everything you have run under the profile &ldquo;{user.name}&rdquo;.
        </p>

        {attempts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-surface p-12 text-center">
            <Inbox size={28} className="text-muted" />
            <p className="text-sm text-muted">Nothing yet — start a module or a full exam.</p>
            <Link
              href="/dashboard"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Go to modules
            </Link>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-xl border bg-surface">
            {attempts.map((a) => {
              const mod = a.module_id ? MODULE_BY_ID.get(a.module_id) : null;
              const duration = a.finished_at
                ? Math.round(
                    (new Date(a.finished_at).getTime() - new Date(a.started_at).getTime()) / 1000
                  )
                : null;
              return (
                <Link
                  key={a.id}
                  href={a.finished_at ? `/results/${a.id}` : `/run/${a.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.mode === 'exam' ? 'Full exam' : (mod?.title ?? `Module ${a.module_id}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(a.started_at)}
                      {duration !== null && ` · ${formatDuration(duration)}`}
                      {a.mode === 'practice' && a.scope === 'wrong' && ' · redo of wrong answers'}
                      {a.mode === 'practice' && a.scope === 'unseen' && ' · unseen only'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {a.finished_at ? (
                      <>
                        <span className="text-sm tabular-nums">
                          {a.correct_count}/{a.total}
                          <span className="ml-1.5 text-muted">
                            {a.score_pct !== null && `${formatPct(a.score_pct)}%`}
                          </span>
                        </span>
                        {a.mode === 'exam' &&
                          (a.passed === 1 ? (
                            <Pill tone="good">
                              <CheckCircle2 size={12} /> Pass
                            </Pill>
                          ) : (
                            <Pill tone="bad">
                              <XCircle size={12} /> Fail
                            </Pill>
                          ))}
                      </>
                    ) : (
                      <Pill tone="accent">In progress</Pill>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
