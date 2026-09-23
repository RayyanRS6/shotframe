import { describe, expect, it } from 'vitest';
import { exportDimensions } from './dimensions';
import { RATIOS, TIERS, REF_LONG_EDGE } from '../presets/ratios';

function refSize(aspect: number) {
  return aspect >= 1 ? { w: REF_LONG_EDGE, h: REF_LONG_EDGE / aspect } : { w: REF_LONG_EDGE * aspect, h: REF_LONG_EDGE };
}

describe('exportDimensions', () => {
  it.each([
    ['16:9', 'uhd', 3840, 2160],
    ['16:9', 'hd', 1920, 1080],
    ['9:16', 'hd', 1080, 1920],
    ['4:5', '2k', 2048, 2560],
    ['3:1', 'uhd', 3840, 1280],
    ['1:1', 'hd', 1920, 1920],
  ])('%s at %s is %i × %i', (ratio, tier, width, height) => {
    const aspect = RATIOS.find((r) => r.id === ratio)!.aspect!;
    const longEdge = TIERS.find((t) => t.id === tier)!.longEdge;
    const { w, h } = refSize(aspect);
    expect(exportDimensions(w, h, longEdge)).toEqual({ width, height });
  });

  it('keeps the long edge exact and the aspect within a pixel for every ratio × tier', () => {
    for (const ratio of RATIOS.filter((r) => r.aspect)) {
      for (const tier of TIERS) {
        const { w, h } = refSize(ratio.aspect!);
        const out = exportDimensions(w, h, tier.longEdge);
        expect(Math.max(out.width, out.height)).toBe(tier.longEdge);
        expect(Math.abs(out.width - out.height * ratio.aspect!)).toBeLessThanOrEqual(1);
      }
    }
  });
});
