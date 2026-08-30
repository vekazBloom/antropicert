import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { ResultsView } from '@/components/ResultsView';
import { ButtonLink, ScoreRing, formatDate, formatDuration } from '@/components/ui';
import { EXAM_PASS_CORRECT, EXAM_PASS_PCT, MODULE_BY_ID } from '@/data/modules';
import { buildReview, finishAttempt, getAttempt } from '@/lib/attempts';
import { currentUser } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect('/');

  let attempt = getAttempt(Number(id));
  if (!attempt || attempt.user_id !== user.id) notFound();
  if (!attempt.finished_at) attempt = finishAttempt(attempt);

  const review = buildReview(attempt);
  const isExam = attempt.mode === 'exam';
  const passed = review.passed === true;
  const mod = attempt.module_id ? MODULE_BY_ID.get(attempt.module_id) : null;

  return (
    <>
      <AppHeader userName={user.name} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <section className="mb-8 flex flex-col items-center gap-6 rounded-xl border bg-surface p-7 sm:flex-row sm:items-center">
          <ScoreRing
            pct={review.scorePct}
            label={`${review.correctCount} of ${review.items.length}`}
            tone={isExam ? (passed ? 'good' : 'bad') : 'accent'}
          />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              {isExam ? 'Full exam' : `Module ${attempt.module_id} practice`}
            </p>
            <h1 className="mt-1 text-2xl font-semibold">
              {isExam ? (passed ? 'Passed' : 'Not passed') : (mod?.title ?? 'Practice')}
            </h1>
            {isExam && (
              <p
                className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  passed ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
                }`}
              >
                {passed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                {passed
                  ? `Above the ${EXAM_PASS_PCT}% pass mark`
                  : `${EXAM_PASS_CORRECT - review.correctCount} more correct needed to pass`}
              </p>
            )}
            <p className="mt-3 text-sm text-muted">
              {formatDate(attempt.started_at)} &middot; took {formatDuration(review.durationSec)}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <ButtonLink href={isExam ? '/exam' : `/practice/${attempt.module_id}`}>
                <RotateCcw size={15} />
                {isExam ? 'Take another exam' : 'Practice again'}
              </ButtonLink>
              <ButtonLink href="/dashboard" variant="ghost">
                Back to modules
              </ButtonLink>
            </div>
          </div>
        </section>

        <ResultsView review={review} />

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/history" className="underline hover:text-foreground">
            See all your attempts
          </Link>
        </p>
      </main>
    </>
  );
}
