'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Flag, Lightbulb, XCircle } from 'lucide-react';
import { QuestionCard, type Label } from '@/components/QuestionCard';
import { ProgressBar } from '@/components/ui';
import type { RunPayload } from '@/lib/attempts';

type Feedback = { isCorrect: boolean; correctDisplay: Label; explanation: string };

export function PracticeRunner({ payload }: { payload: RunPayload }) {
  const router = useRouter();
  const { questions } = payload;

  const [results, setResults] = useState<Record<string, Feedback>>(
    () => payload.revealed as Record<string, Feedback>
  );
  const [given, setGiven] = useState<Record<string, Label>>(
    () => payload.given as Record<string, Label>
  );

  // Resume where the user left off.
  const firstUnanswered = questions.findIndex((q) => !(q.id in payload.revealed));
  const [index, setIndex] = useState(firstUnanswered === -1 ? 0 : firstUnanswered);
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const question = questions[index];
  const feedback = results[question.id];
  const answeredCount = Object.keys(results).length;
  const correctCount = useMemo(
    () => Object.values(results).filter((r) => r.isCorrect).length,
    [results]
  );

  async function choose(label: Label) {
    if (feedback || busy) return;
    setBusy(true);
    setGiven((g) => ({ ...g, [question.id]: label }));
    const res = await fetch(`/api/attempts/${payload.attempt.id}/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, selected: label }),
    });
    const data = await res.json();
    if (data.feedback) setResults((r) => ({ ...r, [question.id]: data.feedback }));
    setBusy(false);
  }

  async function finish() {
    setFinishing(true);
    await fetch(`/api/attempts/${payload.attempt.id}/finish`, { method: 'POST' });
    router.push(`/results/${payload.attempt.id}`);
  }

  const isLast = index === questions.length - 1;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted">
            {answeredCount} of {questions.length} answered
          </span>
          <span className="tabular-nums">
            {answeredCount > 0 && (
              <>
                <span className="font-medium text-good">{correctCount}</span>
                <span className="text-muted"> / {answeredCount} right</span>
              </>
            )}
          </span>
        </div>
        <ProgressBar value={answeredCount} max={questions.length} />
      </div>

      <QuestionCard
        question={question}
        index={index}
        total={questions.length}
        selected={given[question.id] ?? null}
        correctLabel={feedback?.correctDisplay ?? null}
        locked={Boolean(feedback) || busy}
        onSelect={choose}
      />

      {feedback && (
        <div
          className={`rounded-xl border p-5 ${
            feedback.isCorrect ? 'border-good bg-good-soft' : 'border-bad bg-bad-soft'
          }`}
        >
          <p
            className={`mb-2 flex items-center gap-2 text-sm font-semibold ${
              feedback.isCorrect ? 'text-good' : 'text-bad'
            }`}
          >
            {feedback.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {feedback.isCorrect
              ? 'Correct'
              : `Not quite — the answer is ${feedback.correctDisplay}`}
          </p>
          <p className="flex gap-2 text-sm leading-relaxed">
            <Lightbulb size={16} className="mt-0.5 shrink-0 text-muted" />
            <span>{feedback.explanation}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-30"
        >
          Previous
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={finish}
            disabled={finishing}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-40"
          >
            <Flag size={15} />
            {finishing ? 'Saving…' : 'End & see summary'}
          </button>
          {!isLast && (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Next
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
