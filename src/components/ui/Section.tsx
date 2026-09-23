import type { ReactNode } from 'react';

/** Uppercase group label with optional hint, used throughout the dark sidebar. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.1em] text-lime uppercase">{label}</span>
        {hint && <span className="text-[11px] text-white/60 tabular-nums">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Rounded dark card for grouping controls. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] border border-edge bg-graphite p-4 ${className}`}>{children}</div>;
}
