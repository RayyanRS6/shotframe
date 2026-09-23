import { create } from 'zustand';

interface AssetsState {
  bitmaps: Map<string, ImageBitmap>;
  thumbs: Record<string, string>;
  /** Bumped on every change so the preview knows to redraw. */
  version: number;
  put: (id: string, bitmap: ImageBitmap, blob: Blob) => void;
  clear: () => void;
}

export const useAssets = create<AssetsState>((set, get) => ({
  bitmaps: new Map(),
  thumbs: {},
  version: 0,
  put: (id, bitmap, blob) => {
    const { bitmaps, thumbs, version } = get();
    bitmaps.set(id, bitmap);
    set({ thumbs: { ...thumbs, [id]: URL.createObjectURL(blob) }, version: version + 1 });
  },
  clear: () => {
    const { bitmaps, thumbs, version } = get();
    bitmaps.forEach((b) => b.close());
    Object.values(thumbs).forEach((u) => URL.revokeObjectURL(u));
    set({ bitmaps: new Map(), thumbs: {}, version: version + 1 });
  },
}));
