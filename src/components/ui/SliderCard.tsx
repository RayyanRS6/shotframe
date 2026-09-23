import type { CSSProperties, ReactNode } from 'react';

const MONO = '"JetBrains Mono", ui-monospace, monospace';

/** A px control: uppercase label, accent value, slider in steps of 2, and quick preset chips. */
export function SliderCard({
  label,
  value,
  min,
  max,
  step = 2,
  unit = 'px',
  presets,
  onChange,
  children,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  presets?: number[];
  onChange: (value: number) => void;
  children?: ReactNode;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="rounded-[20px] border border-edge bg-graphite p-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.1em] text-white/85 uppercase">{label}</span>
        <span className="font-display text-[15px] font-semibold text-lime uppercase tabular-nums">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        className="sf-range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--fill': `${Math.max(0, Math.min(100, pct))}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {presets && (
        <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${presets.length}, minmax(0, 1fr))` }}>
          {presets.map((p) => {
            const active = Math.round(value) === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`h-8 min-w-0 rounded-full border text-[11px] transition-colors ${
                  active ? 'border-lime bg-lime font-semibold text-ink' : 'border-edge bg-coal text-white/60 hover:border-[#3d3d3d] hover:text-white'
                }`}
                style={{ fontFamily: MONO }}
              >
                {p}
                {unit}
              </button>
            );
          })}
        </div>
      )}
      {children}
    </div>
  );
}
