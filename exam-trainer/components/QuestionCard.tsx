'use client';

import { Check, X } from 'lucide-react';
import type { PresentedQuestion } from '@/lib/questions';

const LABELS = ['A', 'B', 'C', 'D'] as const;
export type Label = (typeof LABELS)[number];

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong';

export function QuestionCard({
  question,
  index,
  total,
  selected,
  correctLabel,
  locked,
  onSelect,
  header,
}: {
  question: PresentedQuestion;
  index: number;
  total: number;
  selected: Label | null;
  /** Set only once the answer has been revealed. */
  correctLabel?: Label | null;
  locked: boolean;
  onSelect: (label: Label) => void;
  header?: React.ReactNode;
}) {
  const revealed = Boolean(correctLabel);

  function stateOf(label: Label): OptionState {
    if (revealed) {
      if (label === correctLabel) return 'correct';
      if (label === selected) return 'wrong';
      return 'idle';
    }
    return label === selected ? 'selected' : 'idle';
  }

  const classes: Record<OptionState, string> = {
    idle: 'border-line bg-surface hover:border-accent/60 hover:bg-surface-muted',
    selected: 'border-accent bg-accent-soft',
    correct: 'border-good bg-good-soft',
    wrong: 'border-bad bg-bad-soft',
  };

  const badges: Record<OptionState, string> = {
    idle: 'border-line text-muted',
    selected: 'border-accent bg-accent text-white',
    correct: 'border-good bg-good text-white',
    wrong: 'border-bad bg-bad text-white',
  };

  return (
    <div className="rounded-xl border bg-surface p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="font-medium">
          Question {index + 1} of {total}
        </span>
        <span className="truncate">{question.sectionTitle}</span>
      </div>
      {header}
      <p className="mb-5 text-lg leading-relaxed font-medium">{question.question}</p>
      <ul className="flex flex-col gap-2.5">
        {question.options.map((text, i) => {
          const label = LABELS[i];
          const state = stateOf(label);
          return (
            <li key={label}>
              <button
                type="button"
                disabled={locked}
                onClick={() => onSelect(label)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3.5 text-left text-sm transition disabled:cursor-default ${classes[state]}`}
              >
                <span
                  className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${badges[state]}`}
                >
                  {state === 'correct' ? (
                    <Check size={14} strokeWidth={3} />
                  ) : state === 'wrong' ? (
                    <X size={14} strokeWidth={3} />
                  ) : (
                    label
                  )}
                </span>
                <span className="leading-relaxed">{text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
