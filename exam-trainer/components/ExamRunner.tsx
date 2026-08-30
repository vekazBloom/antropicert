'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Send, TriangleAlert } from 'lucide-react';
import { QuestionCard, type Label } from '@/components/QuestionCard';
import { Timer } from '@/components/Timer';
import { EXAM_PASS_CORRECT, EXAM_QUESTION_COUNT } from '@/data/modules';
import type { RunPayload } from '@/lib/attempts';

export function ExamRunner({ payload }: { payload: RunPayload }) {
  const router = useRouter();
  const { questions, attempt } = payload;

  const [given, setGiven] = useState<Record<string, Label>>(
    () => payload.given as Record<string, Label>
  );
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);

  const question = questions[index];
  const answeredCount = Object.keys(given).length;
  const unanswered = questions.length - answeredCount;

  const submit = useCallback(async () => {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    await fetch(`/api/attempts/${attempt.id}/finish`, { method: 'POST' });
    router.push(`/results/${attempt.id}`);
  }, [attempt.id, router]);

  // Warn on accidental navigation away from a live exam.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!submitted.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  async function choose(label: Label) {
    setGiven((g) => ({ ...g, [question.id]: label }));
    await fetch(`/api/attempts/${attempt.id}/answer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, selected: label }),
    });
  }

  function toggleFlag() {
    setFlagged((f) => {
      const next = new Set(f);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface px-5 py-3">
          <span className="text-sm">
            <strong className="tabular-nums">{answeredCount}</strong>
            <span className="text-muted"> / {questions.length} answered</span>
          </span>
          <div className="flex items-center gap-2">
            {attempt.deadline && <Timer deadline={attempt.deadline} onExpire={submit} />}
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              <Send size={15} />
              Submit
            </button>
          </div>
        </div>

        <QuestionCard
          question={question}
          index={index}
          total={questions.length}
          selected={given[question.id] ?? null}
          locked={submitting}
          onSelect={choose}
        />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-30"
          >
            <ArrowLeft size={15} />
            Previous
          </button>
          <button
            type="button"
            onClick={toggleFlag}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
              flagged.has(question.id) ? 'border-accent bg-accent-soft text-accent' : 'hover:bg-surface-muted'
            }`}
          >
            <Bookmark size={15} />
            {flagged.has(question.id) ? 'Flagged' : 'Flag'}
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={index === questions.length - 1}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-30"
          >
            Next
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <aside className="rounded-xl border bg-surface p-4 lg:sticky lg:top-6 lg:w-56 lg:shrink-0">
        <p className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">Questions</p>
        <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-6">
          {questions.map((q, i) => {
            const answered = q.id in given;
            const isFlagged = flagged.has(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                title={isFlagged ? 'Flagged' : answered ? 'Answered' : 'Not answered'}
                className={`relative flex h-7 items-center justify-center rounded-md border text-xs font-medium tabular-nums transition ${
                  i === index
                    ? 'border-accent bg-accent text-white'
                    : answered
                      ? 'border-line bg-surface-muted'
                      : 'border-line text-muted hover:bg-surface-muted'
                }`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          {EXAM_PASS_CORRECT} of {EXAM_QUESTION_COUNT} correct to pass. Answers stay hidden until
          you submit.
        </p>
      </aside>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-sm rounded-xl border bg-surface p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TriangleAlert size={18} className="text-accent" />
              Submit the exam?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {unanswered > 0 ? (
                <>
                  You have <strong className="text-foreground">{unanswered}</strong> unanswered{' '}
                  {unanswered === 1 ? 'question' : 'questions'}. They will be marked wrong.
                </>
              ) : (
                'All questions are answered. You will see your score and every explanation next.'
              )}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-surface-muted"
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {submitting ? 'Grading…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
