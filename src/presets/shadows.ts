import type { ShadowPreset } from '../types/scene';

export interface ShadowLayer {
  blur: number;
  y: number;
  alpha: number;
}

/** Reference-px shadow layers; alpha is multiplied by the strength slider. */
export const SHADOWS: Record<ShadowPreset, ShadowLayer[]> = {
  none: [],
  soft: [{ blur: 70, y: 28, alpha: 0.2 }],
  medium: [{ blur: 40, y: 20, alpha: 0.3 }],
  hard: [{ blur: 6, y: 14, alpha: 0.35 }],
  layered: [
    { blur: 4, y: 2, alpha: 0.1 },
    { blur: 16, y: 8, alpha: 0.1 },
    { blur: 48, y: 24, alpha: 0.14 },
    { blur: 110, y: 56, alpha: 0.16 },
  ],
};

export const SHADOW_OPTIONS: { value: ShadowPreset; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'soft', label: 'Soft' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'layered', label: 'Layered' },
];
