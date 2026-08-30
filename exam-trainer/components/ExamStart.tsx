'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AlarmClock, EyeOff, Play, Shuffle, Target } from 'lucide-react';
import { EXAM_PASS_CORRECT, EXAM_PASS_PCT, EXAM_QUESTION_COUNT } from '@/data/modules';

const TIMER_CHOICES = [
  { label: 'No timer', value: 0 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '90 min', value: 90 * 60 },
];

export function ExamStart({ perModule }: { perModule: { moduleId: number; count: number }[] }) {
  const router = useRouter();
  const [timeLimitSec, setTimeLimitSec] = useState(60 * 60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'exam', timeLimitSec: timeLimitSec || null }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? 'could not start the exam');
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/run/${data.attempt.id}`);
  }

  return (
    <div className="rounded-xl border bg-surface p-6">
      <h1 className="text-xl font-semibold">Full exam simulation</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {EXAM_QUESTION_COUNT} questions pulled at random from all eight modules, weighted by how
        many questions each module holds.
      </p>

      <ul className="mt-5 flex flex-col gap-3 text-sm">
        <li className="flex gap-3">
          <Target size={17} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Pass mark is {EXAM_PASS_PCT}% &mdash; you need{' '}
            <strong>
              {EXAM_PASS_CORRECT} of {EXAM_QUESTION_COUNT}
            </strong>{' '}
            correct.
          </span>
        </li>
        <li className="flex gap-3">
          <EyeOff size={17} className="mt-0.5 shrink-0 text-accent" />
          <span>
            No right/wrong feedback during the exam. Every answer, the correct one and the
            explanation appear once you submit.
          </span>
        </li>
        <li className="flex gap-3">
          <Shuffle size={17} className="mt-0.5 shrink-0 text-accent" />
          <span>Answer order is shuffled, and you can change any answer until you submit.</span>
        </li>
      </ul>

      <div className="mt-6">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted uppercase">
          <AlarmClock size={13} />
          Time limit
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIMER_CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setTimeLimitSec(c.value)}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                timeLimitSec === c.value ? 'border-accent bg-accent-soft' : 'hover:bg-surface-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <details className="mt-5 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">
          How the {EXAM_QUESTION_COUNT} questions are split
        </summary>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-4">
          {perModule.map((p) => (
            <li key={p.moduleId} className="tabular-nums">
              Module {p.moduleId}: {p.count}
            </li>
          ))}
        </ul>
      </details>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      <button
        type="button"
        onClick={start}
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
      >
        <Play size={16} />
        {busy ? 'Building your exam…' : 'Begin exam'}
      </button>
    </div>
  );
}
