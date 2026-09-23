import type { ExportFormat, Scene } from '../types/scene';
import { ratioView, tierLongEdge } from '../presets/ratios';
import { composeScene } from '../render/composition';
import { measureContext } from '../render/measure';
import { renderScene, type Bitmaps } from '../render/renderScene';
import { loadSceneFonts } from '../render/text';
import { exportDimensions } from './dimensions';

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
}

export function sceneExportSize(scene: Scene) {
  const comp = composeScene(scene, measureContext());
  return exportDimensions(comp.width, comp.height, tierLongEdge(scene.export.tier));
}

export async function renderToBlob(scene: Scene, bitmaps: Bitmaps, format: ExportFormat = scene.export.format): Promise<ExportResult> {
  await loadSceneFonts(scene);
  const comp = composeScene(scene, measureContext());
  const { width, height } = exportDimensions(comp.width, comp.height, tierLongEdge(scene.export.tier));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a canvas for export');
  renderScene(ctx, scene, bitmaps, width, height, comp);

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export failed — try a smaller size'))),
      `image/${format}`,
      format === 'png' ? undefined : scene.export.quality,
    ),
  );
  canvas.width = 0;
  canvas.height = 0;
  return { blob, width, height };
}

export function exportFileName(scene: Scene, r: ExportResult): string {
  // Browsers without WebP encoding fall back to PNG; name the file by what we actually got.
  const ext = r.blob.type === 'image/jpeg' ? 'jpg' : r.blob.type === 'image/webp' ? 'webp' : 'png';
  const ratio = ratioView(scene.ratio, scene.ratioFlipped).label.replace(':', 'x').toLowerCase();
  return `shotframe-${ratio}-${r.width}x${r.height}.${ext}`;
}

export async function downloadScene(scene: Scene, bitmaps: Bitmaps): Promise<ExportResult> {
  const result = await renderToBlob(scene, bitmaps);
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName(scene, result);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return result;
}

export function clipboardSupported(): boolean {
  return typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
}

export async function copySceneToClipboard(scene: Scene, bitmaps: Bitmaps): Promise<void> {
  if (!clipboardSupported()) throw new Error('This browser cannot copy images to the clipboard');
  // Safari needs the ClipboardItem created synchronously with a pending blob.
  const blob = renderToBlob(scene, bitmaps, 'png').then((r) => r.blob);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
