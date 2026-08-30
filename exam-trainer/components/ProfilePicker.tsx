'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GraduationCap, Plus, User } from 'lucide-react';
import type { UserRow } from '@/lib/db';

export function ProfilePicker({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function select(userId: number) {
    setBusy(true);
    await fetch('/api/users/select', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    router.push('/dashboard');
    router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? 'could not create profile');
      setBusy(false);
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <GraduationCap size={28} />
        </div>
        <h1 className="text-2xl font-semibold">CCAO-F Exam Trainer</h1>
        <p className="mt-2 text-sm text-muted">
          Claude Certified Associate &ndash; Foundations. 757 practice questions across 8 modules.
        </p>
      </div>

      {users.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Continue as</p>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              disabled={busy}
              onClick={() => select(u.id)}
              className="flex items-center gap-3 rounded-lg border bg-surface px-4 py-3 text-left text-sm font-medium transition hover:border-accent/60 hover:bg-surface-muted disabled:opacity-60"
            >
              <User size={18} className="text-muted" />
              {u.name}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={create} className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">
          {users.length > 0 ? 'Or create a new profile' : 'Create a profile'}
        </p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            className="flex-1 rounded-lg border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <Plus size={16} />
            Create
          </button>
        </div>
        {error && <p className="text-sm text-bad">{error}</p>}
      </form>
    </main>
  );
}
