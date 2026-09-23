import type { FontId } from '../types/scene';

export interface FontPreset {
  id: FontId;
  label: string;
  family: string;
  description: string;
  weights: number[];
  fallback: string;
}

const W5 = [400, 500, 600, 700, 800];

export const FONTS: FontPreset[] = [
  { id: 'plus-jakarta-sans', label: 'Plus Jakarta Sans', family: 'Plus Jakarta Sans', description: 'Clean modern UI typeface', weights: W5, fallback: 'sans-serif' },
  { id: 'anthropic-serif', label: 'Anthropic Serif', family: 'Anthropic Serif', description: 'Warm, literary editorial serif', weights: W5, fallback: 'serif' },
  { id: 'playfair-display', label: 'Playfair Display', family: 'Playfair Display', description: 'Warm editorial serif', weights: W5, fallback: 'serif' },
  { id: 'outfit', label: 'Outfit', family: 'Outfit', description: 'Geometric high-impact', weights: W5, fallback: 'sans-serif' },
  { id: 'space-grotesk', label: 'Space Grotesk', family: 'Space Grotesk', description: 'Tech & modern aesthetic', weights: [400, 500, 600, 700], fallback: 'sans-serif' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'JetBrains Mono', description: 'Developer & terminal style', weights: W5, fallback: 'monospace' },
  { id: 'caveat', label: 'Caveat', family: 'Caveat', description: 'Casual designer handwriting', weights: [400, 500, 600, 700], fallback: 'cursive' },
  { id: 'syne', label: 'Syne', family: 'Syne', description: 'Contemporary bold fashion', weights: W5, fallback: 'sans-serif' },
  { id: 'poppins', label: 'Poppins', family: 'Poppins', description: 'Friendly geometric sans', weights: W5, fallback: 'sans-serif' },
  { id: 'montserrat', label: 'Montserrat', family: 'Montserrat', description: 'Bold urban display', weights: W5, fallback: 'sans-serif' },
  { id: 'inter', label: 'Inter', family: 'Inter', description: 'Neutral interface workhorse', weights: W5, fallback: 'sans-serif' },
  { id: 'dm-sans', label: 'DM Sans', family: 'DM Sans', description: 'Soft, low-contrast sans', weights: W5, fallback: 'sans-serif' },
  { id: 'manrope', label: 'Manrope', family: 'Manrope', description: 'Rounded modern grotesque', weights: W5, fallback: 'sans-serif' },
  { id: 'fraunces', label: 'Fraunces', family: 'Fraunces', description: 'Expressive soft serif', weights: W5, fallback: 'serif' },
  { id: 'instrument-serif', label: 'Instrument Serif', family: 'Instrument Serif', description: 'Elegant condensed serif', weights: [400], fallback: 'serif' },
];

export function getFont(id: FontId): FontPreset {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}

/** Closest weight the font actually ships. */
export function resolveWeight(font: FontPreset, weight: number): number {
  return font.weights.reduce((best, w) => (Math.abs(w - weight) < Math.abs(best - weight) ? w : best), font.weights[0]);
}

export function fontSpec(id: FontId, weight: number, size: number): string {
  const font = getFont(id);
  return `${resolveWeight(font, weight)} ${size}px "${font.family}", ${font.fallback}`;
}

export function fontStack(id: FontId): string {
  const font = getFont(id);
  return `"${font.family}", ${font.fallback}`;
}
