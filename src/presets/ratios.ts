import type { ExportTier, RatioId } from '../types/scene';

export const REF_LONG_EDGE = 1920;

export interface RatioPreset {
  id: RatioId;
  /** Compact label, e.g. "16:9". */
  label: string;
  /** Card title, e.g. "16 : 9". */
  title: string;
  /** Short hint for the top bar. */
  hint: string;
  description: string;
  /** width / height; null for auto (fit to content). */
  aspect: number | null;
  /** A separate preset that is this ratio turned sideways; flipping switches to it. */
  inverse?: RatioId;
  /** Description when flipped, e.g. 4:3 shown as 3:4. */
  flippedDescription?: string;
}

export const RATIOS: RatioPreset[] = [
  { id: 'auto', label: 'Auto', title: 'Auto Fit', hint: 'Fit content', description: 'Shrinkwrap to images & text', aspect: null },
  { id: '16:9', label: '16:9', title: '16 : 9', hint: 'X post', description: 'Twitter wide, YouTube, Slides', aspect: 16 / 9, inverse: '9:16' },
  { id: '1:1', label: '1:1', title: '1 : 1', hint: 'Square', description: 'Square, Instagram, Twitter feed', aspect: 1 },
  { id: '4:3', label: '4:3', title: '4 : 3', hint: 'Dribbble', description: 'Dribbble, iPad, Standard UI', aspect: 4 / 3, flippedDescription: 'iPad portrait, Pinterest, posters' },
  { id: '2:1', label: '2:1', title: '2 : 1', hint: 'X card', description: 'X / Twitter Summary card', aspect: 2, flippedDescription: 'Tall mobile scroll shots' },
  { id: '3:2', label: '3:2', title: '3 : 2', hint: 'Classic', description: 'Classic photography & Behance', aspect: 3 / 2, flippedDescription: 'Portrait photography & Pinterest' },
  { id: '4:5', label: '4:5', title: '4 : 5', hint: 'Portrait', description: 'Instagram vertical portrait', aspect: 4 / 5, flippedDescription: 'Landscape feed posts' },
  { id: '9:16', label: '9:16', title: '9 : 16', hint: 'Story', description: 'Stories, Reels, Mobile screens', aspect: 9 / 16, inverse: '16:9' },
  { id: '3:1', label: '3:1', title: '3 : 1', hint: 'X header', description: 'X / Twitter header banner', aspect: 3, flippedDescription: 'Tall vertical showcase' },
];

export const TIERS: { id: ExportTier; label: string; longEdge: number }[] = [
  { id: 'hd', label: 'HD', longEdge: 1920 },
  { id: '2k', label: '2K', longEdge: 2560 },
  { id: 'uhd', label: '4K UHD', longEdge: 3840 },
];

export function ratioPreset(id: RatioId): RatioPreset {
  return RATIOS.find((r) => r.id === id) ?? RATIOS[0];
}

/** Auto Fit and square ratios have no other orientation. */
export function isFlippable(p: RatioPreset): boolean {
  return p.aspect !== null && p.aspect !== 1;
}

export interface RatioView {
  label: string;
  title: string;
  hint: string;
  description: string;
  aspect: number | null;
}

/** How a ratio reads and measures, taking the flip into account (4:3 flipped is 3:4). */
export function ratioView(id: RatioId, flipped: boolean): RatioView {
  const p = ratioPreset(id);
  if (!flipped || !isFlippable(p) || p.inverse) {
    return { label: p.label, title: p.title, hint: p.hint, description: p.description, aspect: p.aspect };
  }
  const [w, h] = p.label.split(':');
  return {
    label: `${h}:${w}`,
    title: `${h} : ${w}`,
    hint: p.aspect! > 1 ? 'Portrait' : 'Landscape',
    description: p.flippedDescription ?? p.description,
    aspect: 1 / p.aspect!,
  };
}

export function tierLongEdge(tier: ExportTier): number {
  return TIERS.find((t) => t.id === tier)?.longEdge ?? 1920;
}
