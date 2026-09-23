import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImagePlus, Trash, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import { useSceneStore } from '../store/sceneStore';
import { useAssets } from '../store/assets';
import { addFiles } from '../store/persistence';
import { composeScene } from '../render/composition';
import { measureContext } from '../render/measure';
import { renderScene } from '../render/renderScene';
import { onFontLoaded } from '../render/text';
import { sceneExportSize } from '../export/exportImage';

function ToolbarButton({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`grid size-9 place-items-center rounded-full text-white/80 transition-colors disabled:pointer-events-none disabled:opacity-30 [&>svg]:size-[18px] ${
        danger ? 'hover:bg-coral/15 hover:text-coral' : 'hover:bg-slate hover:text-lime'
      }`}
    >
      {children}
    </button>
  );
}

export function CanvasPreview() {
  const scene = useSceneStore((s) => s.scene);
  const hydrated = useSceneStore((s) => s.hydrated);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const moveImage = useSceneStore((s) => s.moveImage);
  const removeImage = useSceneStore((s) => s.removeImage);
  const assetsVersion = useAssets((s) => s.version);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [fontTick, setFontTick] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => onFontLoaded(() => setFontTick((t) => t + 1)), []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Text metrics change when a font finishes loading, so fontTick is a real dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comp = useMemo(() => composeScene(scene, measureContext()), [scene, fontTick]);
  const size = useMemo(() => sceneExportSize(scene), [scene]);

  const margin = box.w < 640 ? 16 : 40;
  const fit = Math.max(0, Math.min((box.w - margin * 2) / comp.width, (box.h - margin * 2) / comp.height));
  const cssW = Math.floor(comp.width * fit);
  const cssH = Math.floor(comp.height * fit);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cssW < 2 || cssH < 2) return;
    const raf = requestAnimationFrame(() => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(cssW * dpr);
      const ph = Math.round(cssH * dpr);
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      const ctx = canvas.getContext('2d');
      if (ctx) renderScene(ctx, scene, useAssets.getState().bitmaps, pw, ph, comp);
    });
    return () => cancelAnimationFrame(raf);
  }, [scene, comp, cssW, cssH, assetsVersion, fontTick]);

  const hitTest = (clientX: number, clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * comp.width;
    const y = ((clientY - rect.top) / rect.height) * comp.height;
    return comp.placements.findIndex((p) => {
      const r = p.slot ?? p.card;
      return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    });
  };

  const count = scene.images.length;
  const selectedIndex = scene.images.findIndex((i) => i.id === selectedId);
  const toolbarIndex = count > 1 ? (hover ?? (selectedIndex >= 0 ? selectedIndex : null)) : null;
  const toolbarPlacement = toolbarIndex !== null ? comp.placements[toolbarIndex] : undefined;
  const vertical = comp.direction === 'column';
  const k = comp.width ? cssW / comp.width : 0;

  const move = (from: number, to: number) => {
    const id = scene.images[from]?.id;
    moveImage(from, to);
    if (id) select(id);
    setHover(to);
  };

  const empty = count === 0;

  return (
    <section className="flex min-h-0 flex-1 flex-col p-4 pt-3 sm:p-6 sm:pt-4">
      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-rule bg-card p-2.5 shadow-card sm:p-3">
        <div className="flex items-center gap-4 px-2.5 pt-1 pb-2.5 sm:px-3">
          <h2 className="font-display text-[17px] font-bold">Preview</h2>
          <span className="hidden items-center gap-1.5 text-xs text-stone sm:flex">
            <span className="size-2 rounded-full bg-lime-deep" />
            Live
          </span>
          <span className="hidden items-center gap-1.5 text-xs text-stone sm:flex">
            <span className="size-2 rounded-full bg-violet" />
            {count} {count === 1 ? 'screenshot' : 'screenshots'}
          </span>
          <span className="ml-auto rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-lime tabular-nums">
            {size.width} × {size.height} px
          </span>
        </div>

        <div ref={containerRef} className="sf-workspace relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[22px]">
          <div
            className={`relative shadow-[0_18px_50px_rgb(21_21_21/0.18)] transition-opacity duration-300 ${hydrated ? 'opacity-100' : 'opacity-0'}`}
            style={{ width: cssW, height: cssH }}
            onMouseMove={(e) => {
              if ((e.target as HTMLElement).closest('[data-card-toolbar]')) return;
              const i = hitTest(e.clientX, e.clientY);
              setHover(i >= 0 ? i : null);
            }}
            onMouseLeave={() => setHover(null)}
          >
            <canvas
              ref={canvasRef}
              onClick={(e) => {
                const i = hitTest(e.clientX, e.clientY);
                select(i >= 0 ? scene.images[i]?.id ?? null : null);
              }}
              className="block size-full"
              aria-label="Screenshot composition preview"
            />

            {toolbarIndex !== null && toolbarPlacement && (() => {
              const r = toolbarPlacement.slot ?? toolbarPlacement.card;
              const id = scene.images[toolbarIndex]?.id;
              return (
                <div
                  data-card-toolbar
                  className="absolute z-10 flex items-center gap-0.5 rounded-full border border-edge bg-ink/95 p-1 shadow-float backdrop-blur"
                  style={{ left: Math.min((r.x + r.w) * k - 8, cssW - 4), top: Math.max(4, r.y * k - 18), transform: 'translateX(-100%)' }}
                >
                  <ToolbarButton label={vertical ? 'Move up' : 'Move left'} disabled={toolbarIndex === 0} onClick={() => move(toolbarIndex, toolbarIndex - 1)}>
                    {vertical ? <ArrowUp /> : <ArrowLeft />}
                  </ToolbarButton>
                  <ToolbarButton label={vertical ? 'Move down' : 'Move right'} disabled={toolbarIndex === count - 1} onClick={() => move(toolbarIndex, toolbarIndex + 1)}>
                    {vertical ? <ArrowDown /> : <ArrowRight />}
                  </ToolbarButton>
                  <ToolbarButton
                    label="Remove image"
                    danger
                    onClick={() => {
                      if (id) removeImage(id);
                      setHover(null);
                    }}
                  >
                    <Trash />
                  </ToolbarButton>
                </div>
              );
            })()}

            {empty && hydrated && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="flex max-w-[92%] flex-col items-center gap-2.5 rounded-[28px] border-2 border-dashed border-white/70 bg-card/90 px-6 py-6 text-center shadow-card backdrop-blur-md sm:px-10 sm:py-8">
                  <span className="grid size-12 place-items-center rounded-2xl bg-lime text-ink">
                    <ImagePlus className="size-5" />
                  </span>
                  <p className="font-display text-[18px] font-bold text-ink">Drop, paste, or browse screenshots</p>
                  <p className="hidden text-xs text-stone sm:block">PNG, JPG or WebP · everything stays on your device</p>
                  <Button variant="primary" className="mt-1" onClick={() => fileRef.current?.click()}>
                    <Upload /> Browse files
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </section>
  );
}
