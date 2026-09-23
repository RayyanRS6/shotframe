import { useMemo, type ReactNode } from 'react';
import { HexColorInput } from 'react-colorful';
import type { ShadowPreset, Tilt } from '../../types/scene';
import { Card, Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { SliderCard } from '../ui/SliderCard';
import { OptionCard } from '../ui/OptionCard';
import { ColorField } from '../ui/ColorField';
import { Toggle } from '../ui/Toggle';
import { SHADOW_OPTIONS } from '../../presets/shadows';
import { FRAME_OPTIONS, frameOption } from '../../presets/frames';
import { tiltSupported } from '../../render/tilt';
import { useSceneStore } from '../../store/sceneStore';

const BORDER_SWATCHES = ['#EFE7DA', '#FFFFFF', '#F5F5F7', '#D9D9DE', '#151515', '#D4F24A', '#7B5CE6', '#FFC700'];

const TILT_PRESETS: { id: string; label: string; value: Omit<Tilt, 'perspective'> }[] = [
  { id: 'flat', label: 'Flat', value: { rotateX: 0, rotateY: 0, rotateZ: 0 } },
  { id: 'left', label: 'Left', value: { rotateX: 8, rotateY: -22, rotateZ: 0 } },
  { id: 'right', label: 'Right', value: { rotateX: 8, rotateY: 22, rotateZ: 0 } },
  { id: 'back', label: 'Back', value: { rotateX: 28, rotateY: 0, rotateZ: 0 } },
  { id: 'iso', label: 'Iso', value: { rotateX: 45, rotateY: 0, rotateZ: -30 } },
];

const inputClass =
  'h-10 w-full rounded-xl border border-edge bg-coal px-3 text-[13px] text-white placeholder:text-smoke/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-[13px] text-white/70">{label}</span>
      {children}
    </div>
  );
}

export function StylePanel() {
  const style = useSceneStore((s) => s.scene.style);
  const patch = useSceneStore((s) => s.patchStyle);
  const canTilt = useMemo(() => tiltSupported(), []);
  const setTilt = (t: Partial<Tilt>) => patch({ tilt: { ...style.tilt, ...t } });
  const setBorder = (b: Partial<typeof style.border>) => patch({ border: { ...style.border, ...b } });
  const option = frameOption(style.frame);
  const activeTilt = TILT_PRESETS.find(
    (p) => p.value.rotateX === style.tilt.rotateX && p.value.rotateY === style.tilt.rotateY && p.value.rotateZ === style.tilt.rotateZ,
  )?.id;

  return (
    <div className="space-y-5">
      <SliderCard label="Rounded corners" min={0} max={80} value={style.radius} presets={[0, 8, 16, 24, 32, 48]} onChange={(radius) => patch({ radius })} />

      <SliderCard label="Border stroke" min={0} max={40} value={style.border.width} onChange={(width) => setBorder({ width })}>
        <div className="mt-3.5">
          <Row label="Border color">
            <div className="flex items-center gap-2">
              <ColorField size="sm" value={style.border.color} onChange={(color) => setBorder({ color })} swatches={BORDER_SWATCHES} ariaLabel="Border color" />
              <HexColorInput
                prefixed
                color={style.border.color}
                onChange={(color) => setBorder({ color })}
                className="h-8 w-[96px] rounded-lg border border-edge bg-coal px-2 text-xs text-white uppercase focus:outline-none focus-visible:ring-4 focus-visible:ring-lime/25"
                style={{ fontFamily: '"JetBrains Mono", monospace' }}
              />
            </div>
          </Row>
        </div>
      </SliderCard>

      <Field label="Drop shadow">
        <Segmented<ShadowPreset> size="sm" value={style.shadow.preset} onChange={(preset) => patch({ shadow: { ...style.shadow, preset } })} options={SHADOW_OPTIONS} />
      </Field>
      {style.shadow.preset !== 'none' && (
        <Slider
          label="Shadow strength"
          min={0}
          max={2}
          step={0.05}
          value={style.shadow.strength}
          onChange={(strength) => patch({ shadow: { ...style.shadow, strength } })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      )}

      <Field label="Window & browser frame">
        <div className="grid grid-cols-2 gap-2">
          {FRAME_OPTIONS.map((f) => (
            <OptionCard key={f.value} title={f.label} description={f.description} active={style.frame === f.value} onClick={() => patch({ frame: f.value })} />
          ))}
        </div>
      </Field>

      {(option.title || option.url || option.dark) && (
        <Card className="space-y-3">
          {option.title && (
            <label className="block space-y-1.5">
              <span className="text-[12px] text-white/70">{style.frame === 'polaroid' ? 'Caption' : 'Window title'}</span>
              <input type="text" value={style.frameTitle} onChange={(e) => patch({ frameTitle: e.target.value })} placeholder="Dashboard — Comparison" className={inputClass} />
            </label>
          )}
          {option.url && (
            <label className="block space-y-1.5">
              <span className="text-[12px] text-white/70">Address bar</span>
              <input type="text" value={style.frameUrl} onChange={(e) => patch({ frameUrl: e.target.value })} placeholder="yourproduct.com" className={inputClass} />
            </label>
          )}
          {option.dark && (
            <Row label="Dark appearance">
              <Toggle checked={style.frameDark} onChange={(frameDark) => patch({ frameDark })} label="Dark appearance" />
            </Row>
          )}
        </Card>
      )}

      <Field label="3D tilt" hint={canTilt ? undefined : 'Needs WebGL'}>
        <Segmented
          size="sm"
          disabled={!canTilt}
          value={activeTilt ?? ''}
          onChange={(id) => {
            const preset = TILT_PRESETS.find((p) => p.id === id);
            if (preset) setTilt(preset.value);
          }}
          options={TILT_PRESETS.map((p) => ({ value: p.id, label: p.label }))}
        />
      </Field>
      {canTilt && (
        <Card className="space-y-3">
          <Slider label="Rotate X" min={-60} max={60} value={style.tilt.rotateX} onChange={(rotateX) => setTilt({ rotateX })} format={(v) => `${Math.round(v)}°`} />
          <Slider label="Rotate Y" min={-60} max={60} value={style.tilt.rotateY} onChange={(rotateY) => setTilt({ rotateY })} format={(v) => `${Math.round(v)}°`} />
          <Slider label="Rotate Z" min={-45} max={45} value={style.tilt.rotateZ} onChange={(rotateZ) => setTilt({ rotateZ })} format={(v) => `${Math.round(v)}°`} />
          <Slider
            label="Perspective"
            min={800}
            max={6000}
            step={50}
            value={style.tilt.perspective}
            onChange={(perspective) => setTilt({ perspective })}
            format={(v) => (v < 1800 ? 'Strong' : v < 3500 ? 'Medium' : 'Subtle')}
          />
        </Card>
      )}
    </div>
  );
}
