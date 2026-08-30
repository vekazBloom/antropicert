'use client';

import { useState } from 'react';
import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';

import type { Review } from '@/lib/attempts';

const LABELS = ['A', 'B', 'C', 'D'] as const;

export function ResultsView({ review }: { review: Review }) {
  const [onlyWrong, setOnlyWrong] = useState(review.correctCount < review.items.length);
  const items = onlyWrong ? review.items.filter((i) => !i.isCorrect) : review.items;

  if (review.items.length === 0) {
    return (
      <p className="rounded-xl border bg-surface p-10 text-center text-sm text-muted">
        You ended this session before answering anything, so there is nothing to review.
      </p>
    );
  }

  return (
    <>
      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">
            Per module
          </h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            {review.perModule.map((m) => {
              const pct = (m.correct / m.total) * 100;
              return (
                <li key={m.moduleId} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-muted">Module {m.moduleId}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 72 ? 'var(--good)' : 'var(--bad)',
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums">
                    {m.correct}/{m.total}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-xl border bg-surface p-6">
          <h2 className="mb-3 text-sm font-medium tracking-wide text-muted uppercase">Review</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyWrong(false)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                !onlyWrong ? 'border-accent bg-accent-soft' : 'hover:bg-surface-muted'
              }`}
            >
              All {review.items.length}
            </button>
            <button
              type="button"
              onClick={() => setOnlyWrong(true)}
              className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                onlyWrong ? 'border-accent bg-accent-soft' : 'hover:bg-surface-muted'
              }`}
            >
              Only wrong ({review.items.length - review.correctCount})
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Every question below shows what you picked, the correct answer, and the explanation from
            the source answer key.
          </p>
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.question.id} className="rounded-xl border bg-surface p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                  item.isCorrect ? 'bg-good-soft text-good' : 'bg-bad-soft text-bad'
                }`}
              >
                {item.isCorrect ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                {item.isCorrect ? 'Correct' : item.selectedDisplay ? 'Wrong' : 'Not answered'}
              </span>
              <span>Q{item.index + 1}</span>
              <span className="truncate">
                Module {item.question.moduleId} &middot; {item.question.sectionTitle}
              </span>
            </div>
            <p className="mb-3 leading-relaxed font-medium">{item.question.question}</p>
            <ul className="mb-3 flex flex-col gap-1.5 text-sm">
              {item.question.options.map((text, i) => {
                const label = LABELS[i];
                const isCorrect = label === item.correctDisplay;
                const isPicked = label === item.selectedDisplay;
                return (
                  <li
                    key={label}
                    className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 ${
                      isCorrect
                        ? 'border-good bg-good-soft'
                        : isPicked
                          ? 'border-bad bg-bad-soft'
                          : 'border-transparent'
                    }`}
                  >
                    <span className="mt-px w-4 shrink-0 text-xs font-semibold">{label}</span>
                    <span className="leading-relaxed">{text}</span>
                    {isPicked && (
                      <span className="ml-auto shrink-0 text-xs whitespace-nowrap text-muted">
                        your answer
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="flex gap-2 rounded-lg bg-surface-muted p-3 text-sm leading-relaxed">
              <Lightbulb size={15} className="mt-0.5 shrink-0 text-muted" />
              <span>{item.explanation}</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
