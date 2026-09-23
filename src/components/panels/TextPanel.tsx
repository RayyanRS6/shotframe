import { useState } from 'react';
import { HexColorInput } from 'react-colorful';
import { TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react';
import type { CaptionPosition, PillBlock, TextAlign, TextBlock } from '../../types/scene';
import { Card, Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { SliderCard } from '../ui/SliderCard';
import { OptionCard } from '../ui/OptionCard';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { ColorField } from '../ui/ColorField';
import { FONTS, fontStack, getFont, resolveWeight } from '../../presets/fonts';
import { useSceneStore, type TextRole } from '../../store/sceneStore';

const ROLES: { id: TextRole; label: string }[] = [
  { id: 'pill', label: 'Pill' },
  { id: 'heading', label: 'Heading' },
  { id: 'paragraph', label: 'Paragraph' },
];

const SIZE_PRESETS: Record<TextRole, number[]> = {
  pill: [16, 20, 24, 28, 32],
  heading: [48, 56, 64, 72, 96],
  paragraph: [20, 24, 28, 32, 40],
};

const TEXT_SWATCHES = ['#FFFFFF', '#151515', '#D4F24A', '#7B5CE6', '#B79CFF', '#FFC700', '#93D5AE', '#FF6B6B'];
const WEIGHT_NAMES: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold' };

const fieldClass =
  'block w-full rounded-xl border border-edge bg-coal px-3 text-[13px] text-white placeholder:text-smoke/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25';
const hexClass =
  'h-8 w-[96px] rounded-lg border border-edge bg-coal px-2 text-xs text-white uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25';

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[13px] text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <ColorField size="sm" value={value} onChange={onChange} swatches={TEXT_SWATCHES} ariaLabel={label} />
        <HexColorInput prefixed color={value} onChange={onChange} className={hexClass} style={{ fontFamily: '"JetBrains Mono", monospace' }} />
      </div>
    </div>
  );
}

function BlockEditor({ role }: { role: TextRole }) {
  const block = useSceneStore((s) => s.scene.caption[role]) as TextBlock & Partial<PillBlock>;
  const patchText = useSceneStore((s) => s.patchText);
  const patch = (p: Partial<PillBlock>) => patchText(role, p);
  const font = getFont(block.font);
  const label = ROLES.find((r) => r.id === role)!.label;
  const isPill = role === 'pill';

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.1em] text-white/85 uppercase">Show {label}</span>
          <Toggle checked={block.enabled} onChange={(enabled) => patch({ enabled })} label={`Show ${label}`} />
        </div>
        {isPill ? (
          <input
            type="text"
            value={block.content}
            onChange={(e) => patch({ content: e.target.value, enabled: true })}
            placeholder="UI/UX Comparison"
            className={`${fieldClass} h-10`}
            style={{ fontFamily: fontStack(block.font) }}
          />
        ) : (
          <textarea
            value={block.content}
            onChange={(e) => patch({ content: e.target.value, enabled: true })}
            rows={role === 'heading' ? 2 : 3}
            placeholder={role === 'heading' ? 'Dashboard Evolution: Light vs Dark' : 'A sentence or two about the change…'}
            className={`${fieldClass} resize-y py-2.5`}
            style={{ fontFamily: fontStack(block.font) }}
          />
        )}
        <ColorRow label="Text color" value={block.color} onChange={(color) => patch({ color })} />
        {isPill && (
          <>
            <ColorRow label="Pill color" value={block.background ?? '#7B5CE6'} onChange={(background) => patch({ background })} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-white/70">Uppercase</span>
              <Toggle checked={!!block.uppercase} onChange={(uppercase) => patch({ uppercase })} label="Uppercase" />
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
              onClick={() => patch({ font: f.id, weight: resolveWeight(f, block.weight) })}
              titleStyle={{ fontFamily: fontStack(f.id), fontWeight: 600 }}
            />
          ))}
        </div>
      </Field>

      <Field label="Weight">
        <Select
          ariaLabel="Font weight"
          value={String(resolveWeight(font, block.weight))}
          onChange={(w) => patch({ weight: Number(w) })}
          options={font.weights.map((w) => ({ value: String(w), label: WEIGHT_NAMES[w] ?? String(w) }))}
        />
      </Field>

      <SliderCard label="Font size" min={12} max={200} value={block.size} presets={SIZE_PRESETS[role]} onChange={(size) => patch({ size })} />

      <Card className="space-y-3">
        <Slider label="Letter spacing" min={-0.1} max={0.3} step={0.01} value={block.letterSpacing} onChange={(letterSpacing) => patch({ letterSpacing })} format={(v) => `${v.toFixed(2)}em`} />
        {!isPill && (
          <Slider label="Line height" min={0.9} max={2} step={0.05} value={block.lineHeight} onChange={(lineHeight) => patch({ lineHeight })} format={(v) => v.toFixed(2)} />
        )}
      </Card>
    </div>
  );
}

export function TextPanel() {
  const caption = useSceneStore((s) => s.scene.caption);
  const patchCaption = useSceneStore((s) => s.patchCaption);
  const [role, setRole] = useState<TextRole>('heading');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position">
          <Segmented<CaptionPosition>
            size="sm"
            value={caption.position}
            onChange={(position) => patchCaption({ position })}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
            ]}
          />
        </Field>
        <Field label="Align">
          <Segmented<TextAlign>
            size="sm"
            value={caption.align}
            onChange={(align) => patchCaption({ align })}
            options={[
              { value: 'left', label: <TextAlignStart />, title: 'Align left' },
              { value: 'center', label: <TextAlignCenter />, title: 'Align center' },
              { value: 'right', label: <TextAlignEnd />, title: 'Align right' },
            ]}
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Text elements">
        {ROLES.map((r) => {
          const active = r.id === role;
          const on = caption[r.id].enabled;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(r.id)}
              className={`flex items-center justify-between rounded-full border px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                active ? 'border-lime bg-lime text-ink' : 'border-edge bg-graphite text-white/70 hover:text-white'
              }`}
            >
              {r.label}
              <span
                className={`size-1.5 rounded-full ${on ? (active ? 'bg-ink' : 'bg-lime') : active ? 'bg-ink/25' : 'bg-[#3a3a3a]'}`}
                title={on ? 'Shown' : 'Hidden'}
              />
            </button>
          );
        })}
      </div>

      <BlockEditor key={role} role={role} />
    </div>
  );
}
