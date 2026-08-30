'use client';

import { useEffect, useState } from 'react';
import { AlarmClock } from 'lucide-react';

/**
 * Counts down to an absolute deadline supplied by the server, so a page
 * refresh cannot reset the clock.
 *
 * The remaining time is only computed after mount — reading the clock during
 * the server render would produce a different string than the first client
 * render and break hydration.
 */
export function Timer({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, deadline - Date.now());
      setRemaining(left);
      if (left === 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  const total = remaining === null ? null : Math.floor(remaining / 1000);
  const text =
    total === null
      ? '--:--'
      : `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  const urgent = total !== null && total <= 300;

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold tabular-nums ${
        urgent ? 'border-bad bg-bad-soft text-bad' : 'bg-surface'
      }`}
    >
      <AlarmClock size={16} />
      {text}
    </span>
  );
}
