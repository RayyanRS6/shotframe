import { useEffect, useRef, useState } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

const POPOVER_W = 232;

export function ColorField({
  value,
  onChange,
  swatches,
  ariaLabel = 'Pick color',
  size = 'md',
}: {
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
  ariaLabel?: string;
  size?: 'sm' | 'md';
}) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === 'keydown' && (e as KeyboardEvent).key !== 'Escape') return;
      if (e.target instanceof Node && (popRef.current?.contains(e.target) || buttonRef.current?.contains(e.target))) return;
      setPos(null);
    };
    const closeNow = (e: Event) => {
      if (e.target instanceof Node && popRef.current?.contains(e.target)) return;
      setPos(null);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    window.addEventListener('resize', closeNow);
    window.addEventListener('scroll', closeNow, true);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
      window.removeEventListener('resize', closeNow);
      window.removeEventListener('scroll', closeNow, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = buttonRef.current!.getBoundingClientRect();
    const height = swatches ? 300 : 250;
    const left = Math.min(Math.max(8, r.left), window.innerWidth - POPOVER_W - 8);
    const top = r.bottom + 8 + height > window.innerHeight ? Math.max(8, r.top - height - 8) : r.bottom + 8;
    setPos({ left, top });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        onClick={toggle}
        className={`shrink-0 rounded-xl border border-edge bg-graphite p-1 transition-colors hover:border-[#4a4a4a] ${size === 'sm' ? 'size-8' : 'size-9'}`}
      >
        <span className="block size-full rounded-[8px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]" style={{ background: value }} />
      </button>
      {pos && (
        <div
          ref={popRef}
          className="sf-picker fixed z-50 space-y-3 rounded-[20px] border border-edge bg-graphite p-3 text-white shadow-float [color-scheme:dark]"
          style={{ left: pos.left, top: pos.top, width: POPOVER_W }}
        >
          <HexColorPicker color={value} onChange={onChange} />
          <div className="flex items-center gap-2">
            <span className="size-8 shrink-0 rounded-lg border border-edge" style={{ background: value }} />
            <HexColorInput
              color={value}
              onChange={onChange}
              prefixed
              className="h-8 w-full rounded-lg border border-edge bg-coal px-2 text-xs text-white uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            />
          </div>
          {swatches && (
            <div className="grid grid-cols-8 gap-1.5">
              {swatches.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => onChange(c)}
                  className="aspect-square rounded-md shadow-[inset_0_0_0_1px_rgb(255_255_255/0.14)] transition-transform hover:scale-110"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
