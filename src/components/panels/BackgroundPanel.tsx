import { useMemo, useRef, useState } from 'react';
import { ImageUp, Plus, X } from 'lucide-react';
import type { Gradient, GradientType } from '../../types/scene';
import { Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { ColorField } from '../ui/ColorField';
import {
  GRADIENT_CATEGORIES,
  GRADIENT_PRESETS,
  SOLID_SWATCHES,
  presetToGradient,
  type GradientCategory,
} from '../../presets/gradients';
import { gradientThumbnail } from '../../render/background';
import { useSceneStore } from '../../store/sceneStore';
import { useAssets } from '../../store/assets';
import { setBackgroundImageFile } from '../../store/persistence';

const MAX_COLORS = 6;
const pct = (v: number) => `${Math.round(v * 100)}%`;

export function BackgroundPanel() {
  const bg = useSceneStore((s) => s.scene.background);
  const patch = useSceneStore((s) => s.patchBackground);
  const thumbs = useAssets((s) => s.thumbs);
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<GradientCategory>(
    () => GRADIENT_PRESETS.find((p) => p.id === bg.gradient.presetId)?.category ?? 'light',
  );
  const presetThumbs = useMemo(
    () => Object.fromEntries(GRADIENT_PRESETS.map((p) => [p.id, gradientThumbnail(presetToGradient(p))])),
    [],
  );
  const counts = useMemo(
    () => Object.fromEntries(GRADIENT_CATEGORIES.map((c) => [c.id, GRADIENT_PRESETS.filter((p) => p.category === c.id).length])),
    [],
  );

  const setGradient = (g: Partial<Gradient>) => patch({ kind: 'gradient', gradient: { ...bg.gradient, presetId: null, ...g } });
  const setColor = (i: number, c: string) => setGradient({ colors: bg.gradient.colors.map((x, j) => (j === i ? c : x)) });
  const bgThumb = bg.image.id ? thumbs[bg.image.id] : undefined;
  const selectedRing = 'ring-2 ring-lime ring-offset-2 ring-offset-coal';

  return (
    <div className="space-y-5">
      <Segmented
        value={bg.kind}
        onChange={(kind) => patch({ kind })}
        options={[
          { value: 'gradient', label: 'Gradient' },
          { value: 'solid', label: 'Solid' },
          { value: 'image', label: 'Image' },
        ]}
      />

      {bg.kind === 'gradient' && (
        <>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Gradient categories">
            {GRADIENT_CATEGORIES.map((c) => {
              const active = c.id === category;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCategory(c.id)}
                  className={`h-8 rounded-full border px-3 text-[11px] font-semibold transition-colors ${
                    active ? 'border-lime bg-lime text-ink' : 'border-edge bg-graphite text-white/70 hover:text-white'
                  }`}
                >
                  {c.label}
                  <span className={`ml-1.5 font-normal ${active ? 'text-ink/60' : 'text-smoke'}`}>{counts[c.id]}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {GRADIENT_PRESETS.filter((p) => p.category === category).map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.name}
                aria-label={p.name}
                onClick={() => patch({ kind: 'gradient', gradient: presetToGradient(p) })}
                className={`aspect-[16/10] rounded-xl bg-cover bg-center shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] transition-transform hover:scale-[1.05] ${
                  bg.gradient.presetId === p.id ? selectedRing : ''
                }`}
                style={{ backgroundImage: `url(${presetThumbs[p.id]})` }}
              />
            ))}
          </div>

          <Field label="Style">
            <Segmented<GradientType>
              size="sm"
              value={bg.gradient.type}
              onChange={(type) => setGradient({ type })}
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'radial', label: 'Radial' },
                { value: 'mesh', label: 'Mesh' },
              ]}
            />
          </Field>

          <Field label="Colors">
            <div className="flex flex-wrap items-center gap-2">
              {bg.gradient.colors.map((c, i) => (
                <div key={i} className="group relative">
                  <ColorField value={c} onChange={(hex) => setColor(i, hex)} ariaLabel={`Color ${i + 1}`} />
                  {bg.gradient.colors.length > 2 && (
                    <button
                      type="button"
                      aria-label={`Remove color ${i + 1}`}
                      onClick={() => setGradient({ colors: bg.gradient.colors.filter((_, j) => j !== i) })}
                      className="absolute -top-1.5 -right-1.5 hidden size-4 place-items-center rounded-full bg-white text-ink group-hover:grid"
                    >
                      <X className="size-2.5" strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
              {bg.gradient.colors.length < MAX_COLORS && (
                <button
                  type="button"
                  aria-label="Add color"
                  onClick={() => setGradient({ colors: [...bg.gradient.colors, bg.gradient.colors[bg.gradient.colors.length - 1] ?? '#7B5CE6'] })}
                  className="grid size-9 place-items-center rounded-xl border border-dashed border-edge text-smoke transition-colors hover:border-lime/60 hover:text-white"
                >
                  <Plus className="size-4" />
                </button>
              )}
            </div>
          </Field>

          {bg.gradient.type === 'linear' && (
            <Slider label="Angle" min={0} max={360} value={bg.gradient.angle} onChange={(angle) => setGradient({ angle })} format={(v) => `${Math.round(v)}°`} />
          )}
        </>
      )}

      {bg.kind === 'solid' && (
        <div className="flex items-start gap-3">
          <div className="grid flex-1 grid-cols-6 gap-2">
            {SOLID_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                onClick={() => patch({ solid: c })}
                className={`aspect-square rounded-lg shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-transform hover:scale-110 ${
                  bg.solid.toLowerCase() === c.toLowerCase() ? selectedRing : ''
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
          <ColorField value={bg.solid} onChange={(solid) => patch({ solid })} ariaLabel="Custom color" />
        </div>
      )}

      {bg.kind === 'image' && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[20px] border-[1.5px] border-dashed border-edge bg-graphite text-smoke transition-colors hover:border-lime/60"
          >
            {bgThumb ? (
              <>
                <img src={bgThumb} alt="" className="absolute inset-0 size-full object-cover" />
                <span className="relative rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">Replace image</span>
              </>
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs font-semibold">
                <span className="grid size-10 place-items-center rounded-2xl bg-lime text-ink">
                  <ImageUp className="size-5" />
                </span>
                Upload your own background
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void setBackgroundImageFile(file);
              e.target.value = '';
            }}
          />
          <Slider label="Blur" min={0} max={60} value={bg.image.blur} onChange={(blur) => patch({ image: { ...bg.image, blur } })} format={(v) => `${Math.round(v)}px`} />
          <Slider label="Dim" min={0} max={0.7} step={0.01} value={bg.image.dim} onChange={(dim) => patch({ image: { ...bg.image, dim } })} format={pct} />
        </>
      )}

      <Slider label="Grain" min={0} max={1} step={0.01} value={bg.grain} onChange={(grain) => patch({ grain })} format={pct} />
    </div>
  );
}
