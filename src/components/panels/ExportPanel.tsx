import { useMemo } from 'react';
import { Copy, Download, LoaderCircle } from 'lucide-react';
import type { ExportFormat, ExportTier } from '../../types/scene';
import { Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { TIERS } from '../../presets/ratios';
import { useSceneStore } from '../../store/sceneStore';
import { sceneExportSize, clipboardSupported } from '../../export/exportImage';
import { useExportActions } from '../../hooks/useExportActions';

export function ExportPanel() {
  const scene = useSceneStore((s) => s.scene);
  const patch = useSceneStore((s) => s.patchExport);
  const { busy, download, copy } = useExportActions();
  const size = useMemo(() => sceneExportSize(scene), [scene]);
  const settings = scene.export;

  return (
    <div className="space-y-5">
      <div className="rounded-[20px] bg-lime p-4 text-ink">
        <p className="text-[11px] font-bold tracking-[0.1em] text-ink/60 uppercase">Your image</p>
        <p className="mt-1 font-display text-[28px] leading-none font-bold tabular-nums">
          {size.width} × {size.height}
        </p>
        <p className="mt-1.5 text-[12px] text-ink/60">pixels · {settings.format === 'jpeg' ? 'JPG' : settings.format.toUpperCase()}</p>
      </div>

      <Field label="Resolution">
        <Segmented<ExportTier> value={settings.tier} onChange={(tier) => patch({ tier })} options={TIERS.map((t) => ({ value: t.id, label: t.label }))} />
      </Field>

      <Field label="Format">
        <Segmented<ExportFormat>
          value={settings.format}
          onChange={(format) => patch({ format })}
          options={[
            { value: 'png', label: 'PNG' },
            { value: 'jpeg', label: 'JPG' },
            { value: 'webp', label: 'WebP' },
          ]}
        />
      </Field>
      {settings.format !== 'png' && (
        <Slider label="Quality" min={0.5} max={1} step={0.01} value={settings.quality} onChange={(quality) => patch({ quality })} format={(v) => `${Math.round(v * 100)}%`} />
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2 pt-1">
        <Button variant="primary" onClick={download} disabled={!!busy}>
          {busy === 'download' ? <LoaderCircle className="animate-spin" /> : <Download />}
          Download image
        </Button>
        <Button variant="dark" onClick={copy} disabled={!!busy || !clipboardSupported()} title="Copy PNG to clipboard">
          {busy === 'copy' ? <LoaderCircle className="animate-spin" /> : <Copy />}
          Copy
        </Button>
      </div>
      <p className="text-center text-[12px] text-smoke">Everything is processed in your browser — nothing is uploaded.</p>
    </div>
  );
}
