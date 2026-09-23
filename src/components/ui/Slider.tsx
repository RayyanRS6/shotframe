import type { CSSProperties } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, step = 1, onChange, format, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-white/80">{label}</span>
        <span className="font-semibold text-lime tabular-nums">{format ? format(value) : Math.round(value)}</span>
      </div>
      <input
        type="range"
        className="sf-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ '--fill': `${Math.max(0, Math.min(100, pct))}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
