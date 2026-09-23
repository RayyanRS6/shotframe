import { useState } from 'react';
import { copySceneToClipboard, downloadScene } from '../export/exportImage';
import { useSceneStore } from '../store/sceneStore';
import { useAssets } from '../store/assets';
import { toast } from '../store/toast';

export function useExportActions() {
  const [busy, setBusy] = useState<'download' | 'copy' | null>(null);

  const run = async (kind: 'download' | 'copy') => {
    if (busy) return;
    const { scene } = useSceneStore.getState();
    const { bitmaps } = useAssets.getState();
    setBusy(kind);
    try {
      if (kind === 'download') {
        const r = await downloadScene(scene, bitmaps);
        toast(`Exported ${r.width} × ${r.height}`, 'success');
      } else {
        await copySceneToClipboard(scene, bitmaps);
        toast('Copied — paste it into your post', 'success');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Export failed', 'error');
    } finally {
      setBusy(null);
    }
  };

  return { busy, download: () => run('download'), copy: () => run('copy') };
}
