import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CheckCircle2, ClipboardList, Timer, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Pill, ProgressBar, formatDate, formatPct } from '@/components/ui';
import { EXAM_PASS_CORRECT, EXAM_PASS_PCT, EXAM_QUESTION_COUNT, MODULES } from '@/data/modules';
import { QUESTIONS_BY_MODULE } from '@/lib/questions';
import { currentUser } from '@/lib/session';
import { moduleProgress } from '@/lib/users';
import { db, type AttemptRow } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await currentUser();
  if (!user) redirect('/');

  const progress = moduleProgress(user.id);
  const recent = db
    .prepare(
      `SELECT * FROM attempts WHERE user_id = ? AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 5`
    )
    .all(user.id) as AttemptRow[];

  const bestExam = db
    .prepare(
      `SELECT MAX(score_pct) AS best FROM attempts WHERE user_id = ? AND mode = 'exam' AND finished_at IS NOT NULL`
    )
    .get(user.id) as { best: number | null };

  return (
    <>
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <section className="mb-8 rounded-xl border bg-surface p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold">
                <ClipboardList size={20} className="text-accent" />
                Full exam simulation
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {EXAM_QUESTION_COUNT} questions drawn at random across all eight modules, no feedback
                until you submit. You need {EXAM_PASS_PCT}% to pass &mdash; that is{' '}
                <strong className="text-foreground">
                  {EXAM_PASS_CORRECT} of {EXAM_QUESTION_COUNT}
                </strong>{' '}
                correct.
              </p>
              {bestExam.best !== null && (
                <p className="mt-3 text-sm text-muted">
                  Your best exam score so far:{' '}
                  <strong className="text-foreground">{formatPct(bestExam.best)}%</strong>
                </p>
              )}
            </div>
            <Link
              href="/exam"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Timer size={16} />
              Start exam
            </Link>
          </div>
        </section>

        <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">
          Practice by module
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((m) => {
            const total = QUESTIONS_BY_MODULE.get(m.id)?.length ?? 0;
            const p = progress.get(m.id);
            const answered = p?.answered ?? 0;
            const correct = p?.correct ?? 0;
            return (
              <Link
                key={m.id}
                href={`/practice/${m.id}`}
                className="group flex flex-col rounded-xl border bg-surface p-5 transition hover:border-accent/60"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold tracking-wide text-accent uppercase">
                    Module {m.id}
                  </span>
                  <span className="text-xs text-muted">{total} questions</span>
                </div>
                <h3 className="font-medium">{m.title}</h3>
                <p className="mt-1 mb-4 flex-1 text-sm text-muted">{m.subtitle}</p>
                <ProgressBar value={answered} max={total} />
                <div className="mt-2.5 flex items-center justify-between text-xs text-muted">
                  <span>
                    {answered} of {total} seen
                    {answered > 0 && ` · ${Math.round((correct / answered) * 100)}% right`}
                  </span>
                  <ArrowRight
                    size={14}
                    className="transition group-hover:translate-x-0.5 group-hover:text-accent"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {recent.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">
              Recent attempts
            </h2>
            <div className="divide-y overflow-hidden rounded-xl border bg-surface">
              {recent.map((a) => (
                <Link
                  key={a.id}
                  href={`/results/${a.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm transition hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {a.mode === 'exam'
                        ? 'Full exam'
                        : `Module ${a.module_id} practice`}
                    </p>
                    <p className="text-xs text-muted">{formatDate(a.started_at)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">
                      {a.correct_count}/{a.total}
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
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
