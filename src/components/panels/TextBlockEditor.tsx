import { HexColorInput } from 'react-colorful';
import type { PillBlock, TextBlock } from '../../types/scene';
import { Card, Field } from '../ui/Section';
import { Slider } from '../ui/Slider';
import { SliderCard } from '../ui/SliderCard';
import { OptionCard } from '../ui/OptionCard';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { ColorField } from '../ui/ColorField';
import { FONTS, fontStack, getFont, resolveWeight } from '../../presets/fonts';

export type BlockKind = 'pill' | 'heading' | 'paragraph';

const TEXT_SWATCHES = ['#FFFFFF', '#151515', '#D4F24A', '#7B5CE6', '#B79CFF', '#FFC700', '#93D5AE', '#FF6B6B'];
const WEIGHT_NAMES: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold' };

const fieldClass =
  'block w-full rounded-xl border border-edge bg-coal px-3 text-[13px] text-white placeholder:text-smoke/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25';
const hexClass =
  'h-8 w-[96px] rounded-lg border border-edge bg-coal px-2 text-xs text-white uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25';

export function ColorRow({
  label,
  value,
  onChange,
  swatches = TEXT_SWATCHES,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  swatches?: string[];
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <ColorField size="sm" value={value} onChange={onChange} swatches={swatches} ariaLabel={label} />
        <HexColorInput prefixed color={value} onChange={onChange} className={hexClass} style={{ fontFamily: '"JetBrains Mono", monospace' }} />
      </div>
    </div>
  );
}

/** Pill tabs for switching between text elements; the dot shows whether an element is shown. */
export function BlockTabs<T extends string>({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: { id: T; label: string; on?: boolean }[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }} role="tablist" aria-label={ariaLabel}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`flex items-center justify-between rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${
              active ? 'border-lime bg-lime text-ink' : 'border-edge bg-graphite text-white/70 hover:text-white'
            }`}
          >
            {t.label}
            {t.on !== undefined && (
              <span
                className={`size-1.5 rounded-full ${t.on ? (active ? 'bg-ink' : 'bg-lime') : active ? 'bg-ink/25' : 'bg-[#3a3a3a]'}`}
                title={t.on ? 'Shown' : 'Hidden'}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Words, color, font, weight, size and spacing for one pill, heading or paragraph. */
export function TextBlockEditor({
  kind,
  label,
  block,
  onChange,
  sizePresets,
}: {
  kind: BlockKind;
  label: string;
  block: TextBlock & Partial<PillBlock>;
  onChange: (patch: Partial<PillBlock>) => void;
  sizePresets: number[];
}) {
  const font = getFont(block.font);
  const isPill = kind === 'pill';

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.1em] text-white/85 uppercase">Show {label}</span>
          <Toggle checked={block.enabled} onChange={(enabled) => onChange({ enabled })} label={`Show ${label}`} />
        </div>
        {isPill ? (
          <input
            type="text"
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value, enabled: true })}
            placeholder="UI/UX Comparison"
            className={`${fieldClass} h-10`}
            style={{ fontFamily: fontStack(block.font) }}
          />
        ) : (
          <textarea
            value={block.content}
            onChange={(e) => onChange({ content: e.target.value, enabled: true })}
            rows={kind === 'heading' ? 2 : 3}
            placeholder={kind === 'heading' ? 'Dashboard Evolution: Light vs Dark' : 'A sentence or two about the change…'}
            className={`${fieldClass} resize-y py-2.5`}
            style={{ fontFamily: fontStack(block.font) }}
          />
        )}
        <ColorRow label="Text color" value={block.color} onChange={(color) => onChange({ color })} />
        {isPill && (
          <>
            <ColorRow label="Pill color" value={block.background ?? '#7B5CE6'} onChange={(background) => onChange({ background })} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/70">Uppercase</span>
              <Toggle checked={!!block.uppercase} onChange={(uppercase) => onChange({ uppercase })} label="Uppercase" />
            </div>
          </>
        )}
      </Card>

      <Field label="Font family">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <OptionCard
              key={f.id}
              compact
              title={f.label}
              description={f.description}
              active={f.id === block.font}
              onClick={() => onChange({ font: f.id, weight: resolveWeight(f, block.weight) })}
              titleStyle={{ fontFamily: fontStack(f.id), fontWeight: 600 }}
            />
          ))}
        </div>
      </Field>

      <Field label="Weight">
        <Select
          ariaLabel="Font weight"
          value={String(resolveWeight(font, block.weight))}
          onChange={(w) => onChange({ weight: Number(w) })}
          options={font.weights.map((w) => ({ value: String(w), label: WEIGHT_NAMES[w] ?? String(w) }))}
        />
      </Field>

      <SliderCard label="Font size" min={12} max={200} value={block.size} presets={sizePresets} onChange={(size) => onChange({ size })} />

      <Card className="space-y-3">
        <Slider label="Letter spacing" min={-0.1} max={0.3} step={0.01} value={block.letterSpacing} onChange={(letterSpacing) => onChange({ letterSpacing })} format={(v) => `${v.toFixed(2)}em`} />
        {!isPill && (
          <Slider label="Line height" min={0.9} max={2} step={0.05} value={block.lineHeight} onChange={(lineHeight) => onChange({ lineHeight })} format={(v) => v.toFixed(2)} />
        )}
      </Card>
    </div>
  );
}
