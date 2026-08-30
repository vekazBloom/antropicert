'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Play, Shuffle } from 'lucide-react';
import type { ModuleMeta } from '@/data/modules';

type Scope = 'all' | 'unseen' | 'wrong';

export function PracticeStart({
  module: mod,
  total,
  unseen,
  wrong,
}: {
  module: ModuleMeta;
  total: number;
  unseen: number;
  wrong: number;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<Scope>('all');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts: Record<Scope, number> = { all: total, unseen, wrong };
  const scopes: { key: Scope; label: string; hint: string }[] = [
    { key: 'all', label: 'All questions', hint: `${total} in this module` },
    { key: 'unseen', label: 'Not answered yet', hint: `${unseen} left` },
    { key: 'wrong', label: 'Ones I got wrong', hint: `${wrong} to redo` },
  ];

  async function start() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'practice',
        moduleId: mod.id,
        scope,
        shuffleQuestions,
        shuffleOptions,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? 'could not start');
      setBusy(false);
      return;
    }
    const data = await res.json();
    router.push(`/run/${data.attempt.id}`);
  }

  return (
    <div className="rounded-xl border bg-surface p-6">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
        Module {mod.id} &middot; Practice
      </p>
      <h1 className="mt-1 text-xl font-semibold">{mod.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{mod.covers}</p>

      <div className="mt-6 flex flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">What to drill</p>
        {scopes.map((s) => {
          const disabled = counts[s.key] === 0;
          return (
            <button
              key={s.key}
              type="button"
              disabled={disabled}
              onClick={() => setScope(s.key)}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition disabled:opacity-40 ${
                scope === s.key ? 'border-accent bg-accent-soft' : 'hover:bg-surface-muted'
              }`}
            >
              <span className="font-medium">{s.label}</span>
              <span className="text-xs text-muted">{s.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2.5 text-sm">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Shuffle question order
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="flex items-center gap-1.5">
            Shuffle answer order
            <Shuffle size={13} className="text-muted" />
          </span>
        </label>
        <p className="text-xs leading-relaxed text-muted">
          In modules 1, 2 and 8 the source answer key is heavily weighted towards option B, so
          shuffling stops you learning the position instead of the material.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      <button
        type="button"
        onClick={start}
        disabled={busy || counts[scope] === 0}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
      >
        <Play size={16} />
        {busy ? 'Starting…' : `Start ${counts[scope]} questions`}
      </button>
    </div>
  );
}
