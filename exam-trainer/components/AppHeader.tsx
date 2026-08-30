import Link from 'next/link';
import { GraduationCap, History, LayoutGrid, UserRound } from 'lucide-react';

export function AppHeader({ userName }: { userName: string }) {
  return (
    <header className="border-b bg-surface">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <GraduationCap size={18} />
          </span>
          <span className="hidden sm:inline">CCAO-F Trainer</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Modules</span>
          </Link>
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            <History size={16} />
            <span className="hidden sm:inline">History</span>
          </Link>
          <Link
            href="/?switch=1"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-medium transition hover:bg-surface-muted"
          >
            <UserRound size={16} />
            {userName}
          </Link>
        </nav>
      </div>
    </header>
  );
}
