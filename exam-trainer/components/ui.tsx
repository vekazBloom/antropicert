import Link from 'next/link';
import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-surface p-5 ${className}`}>{children}</div>
  );
}

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'good' | 'bad' | 'accent';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'bg-surface-muted text-muted',
    good: 'bg-good-soft text-good',
    bad: 'bg-bad-soft text-bad',
    accent: 'bg-accent-soft text-accent',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ScoreRing({
  pct,
  label,
  tone,
  size = 168,
}: {
  pct: number;
  label: string;
  tone: 'good' | 'bad' | 'accent';
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const colors = { good: 'var(--good)', bad: 'var(--bad)', accent: 'var(--accent)' } as const;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.max(0, Math.min(100, pct)) / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* One decimal, because rounding 71.7% up to "72%" next to a 72% pass
            mark reads as a contradiction on a failed attempt. */}
        <span className="text-3xl font-semibold tabular-nums">{formatPct(pct)}%</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}

/** Whole numbers stay whole; anything else keeps one decimal. */
export function formatPct(pct: number): string {
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1);
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
}) {
  const styles =
    variant === 'primary'
      ? 'bg-accent text-white hover:opacity-90'
      : 'border bg-surface hover:bg-surface-muted';
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
