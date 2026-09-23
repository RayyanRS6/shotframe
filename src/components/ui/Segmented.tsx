import type { ReactNode } from 'react';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: ReactNode;
  title?: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  disabled,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      className={`flex w-full gap-1 rounded-full border border-edge bg-graphite p-1 ${disabled ? 'pointer-events-none opacity-40' : ''}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors [&>svg]:size-3.5 ${
              size === 'sm' ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs'
            } ${active ? 'bg-lime text-ink' : 'text-smoke hover:text-white'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
