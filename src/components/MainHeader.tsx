import { useMemo } from 'react';
import { useStore } from 'zustand';
import { Copy, Download, FilePlus, LoaderCircle, Redo2, Undo2 } from 'lucide-react';
import { isTextCard, type RatioId, type Scene } from '../types/scene';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Logo } from './Logo';
import { RATIOS, TIERS, ratioView } from '../presets/ratios';
import { redo, undo, useSceneStore } from '../store/sceneStore';
import { newCanvas } from '../store/persistence';
import { sceneExportSize } from '../export/exportImage';
import { useExportActions } from '../hooks/useExportActions';

function StatStrip({ scene, size }: { scene: Scene; size: { width: number; height: number } }) {
  const ratio = ratioView(scene.ratio, scene.ratioFlipped);
  const tier = TIERS.find((t) => t.id === scene.export.tier) ?? TIERS[0];
  const format = scene.export.format === 'jpeg' ? 'JPG' : scene.export.format.toUpperCase();
  const stats = [
    { label: 'Export size', value: `${size.width} × ${size.height}` },
    { label: 'Quality', value: `${tier.label} · ${format}` },
    { label: 'Screenshots', value: String(scene.images.filter((i) => !isTextCard(i)).length) },
    { label: 'Canvas', value: ratio.title },
  ];
  return (
    <div className="sf-tall-only mx-4 hidden shrink-0 grid-cols-4 gap-2 rounded-[26px] bg-lime p-2 sm:mx-6 min-[900px]:grid">
      {stats.map((s) => (
        <div key={s.label} className="min-w-0 rounded-[20px] bg-black/[0.07] px-4 py-2.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-ink/55 uppercase">{s.label}</p>
          <p className="mt-0.5 truncate font-display text-[clamp(14px,1.35vw,19px)] leading-tight font-bold text-ink tabular-nums">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

export function MainHeader() {
  const scene = useSceneStore((s) => s.scene);
  const setRatio = useSceneStore((s) => s.setRatio);
  const canUndo = useStore(useSceneStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useSceneStore.temporal, (s) => s.futureStates.length > 0);
  const { busy, download, copy } = useExportActions();
  const size = useMemo(() => sceneExportSize(scene), [scene]);
  const ratio = ratioView(scene.ratio, scene.ratioFlipped);

  const onNew = () => {
    if (!scene.images.length || window.confirm('Start a new canvas? Your current images and text cards will be removed.')) void newCanvas();
  };

  return (
    <>
      <header className="flex shrink-0 flex-wrap items-center gap-2.5 px-4 pt-4 pb-3 sm:gap-3 sm:px-6 sm:pt-6 sm:pb-4 min-[900px]:flex-nowrap">
        <div className="min-[900px]:hidden">
          <Logo size={36} />
        </div>
        <div className="mr-auto min-w-0 min-[900px]:flex-1">
          <h1 className="font-display text-[26px] leading-none font-bold tracking-tight sm:text-[32px]">Canvas</h1>
          <p className="mt-1.5 hidden truncate text-[13px] text-stone sm:block">Frame, style and export your screenshots — everything stays on your device.</p>
        </div>

        <Select<RatioId>
          tone="light"
          ariaLabel="Aspect ratio"
          value={scene.ratio}
          onChange={setRatio}
          menuMinWidth={240}
          className="shrink-0"
          options={RATIOS.map((r) => ({ value: r.id, label: r.title, hint: r.hint }))}
          renderValue={() => (
            <>
              <span className="font-semibold tabular-nums">{ratio.label}</span>
              <span className="hidden text-stone xl:inline">{ratio.hint}</span>
            </>
          )}
        />

        <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-rule bg-card p-1 shadow-card">
          <Button variant="ghost" size="icon" className="size-8" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" aria-label="Undo">
            <Undo2 />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
            <Redo2 />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onNew} title="New canvas" aria-label="New canvas">
            <FilePlus />
          </Button>
        </div>

        <Button variant="light" className="shadow-card" onClick={copy} disabled={!!busy} title="Copy image to clipboard" aria-label="Copy image">
          {busy === 'copy' ? <LoaderCircle className="animate-spin" /> : <Copy />}
          <span className="hidden xl:inline">Copy</span>
        </Button>
        <Button variant="primary" onClick={download} disabled={!!busy} title={`Export ${size.width} × ${size.height}`}>
          {busy === 'download' ? <LoaderCircle className="animate-spin" /> : <Download />}
          Export
        </Button>
      </header>
      <StatStrip scene={scene} size={size} />
    </>
  );
}
