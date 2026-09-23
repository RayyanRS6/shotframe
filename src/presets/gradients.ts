import type { Gradient, GradientType, MeshBlob } from '../types/scene';

export type GradientCategory = 'light' | 'glow' | 'vivid' | 'chrome' | 'classic';

export const GRADIENT_CATEGORIES: { id: GradientCategory; label: string }[] = [
  { id: 'light', label: 'Light & Airy' },
  { id: 'glow', label: 'Dark Glow' },
  { id: 'vivid', label: 'Vivid & Bold' },
  { id: 'chrome', label: 'Chrome & Glass' },
  { id: 'classic', label: 'Classic Linear' },
];

export interface GradientPreset {
  id: string;
  name: string;
  category: GradientCategory;
  type: GradientType;
  colors: string[];
  angle: number;
  blobs?: MeshBlob[];
  blend?: 'normal' | 'screen';
}

const mesh = (id: string, name: string, category: GradientCategory, colors: string[], blobs: MeshBlob[], blend: 'normal' | 'screen' = 'normal'): GradientPreset =>
  ({ id, name, category, type: 'mesh', angle: 0, colors, blobs, blend });
const linear = (id: string, name: string, category: GradientCategory, angle: number, colors: string[]): GradientPreset =>
  ({ id, name, category, type: 'linear', angle, colors });
const radial = (id: string, name: string, category: GradientCategory, colors: string[]): GradientPreset =>
  ({ id, name, category, type: 'radial', angle: 0, colors });

export const GRADIENT_PRESETS: GradientPreset[] = [
  // Light & Airy
  mesh('lavender-haze', 'Lavender Haze', 'light', ['#EEE9FF', '#C4B3FF', '#FFCDEA', '#B5E0FF'], [
    { x: 0.1, y: 0.2, r: 0.65, c: 1, a: 0.9 }, { x: 0.9, y: 0.25, r: 0.6, c: 2, a: 0.9 }, { x: 0.6, y: 0.95, r: 0.6, c: 3, a: 0.9 },
  ]),
  mesh('holo-light', 'Holographic', 'light', ['#FBFBFF', '#9FF3FF', '#FFB8E6', '#FFF2A6', '#C3B5FF'], [
    { x: 0.3, y: 0.35, r: 0.55, sx: 1.8, sy: 0.3, rot: 0.5, c: 1, a: 0.8 }, { x: 0.55, y: 0.5, r: 0.5, sx: 1.9, sy: 0.25, rot: 0.5, c: 2, a: 0.75 },
    { x: 0.75, y: 0.65, r: 0.45, sx: 2, sy: 0.22, rot: 0.5, c: 3, a: 0.8 }, { x: 0.9, y: 0.1, r: 0.4, c: 4, a: 0.6 },
  ]),
  mesh('peach-cream', 'Peach Cream', 'light', ['#FFEADB', '#FFB39A', '#FFD49E', '#F7A6D0'], [
    { x: 0.85, y: 0.15, r: 0.6, c: 1, a: 0.9 }, { x: 0.15, y: 0.85, r: 0.6, c: 2, a: 0.9 }, { x: 0.9, y: 0.95, r: 0.45, c: 3, a: 0.8 },
  ]),
  mesh('morning-mist', 'Morning Mist', 'light', ['#F4F8FF', '#C9DDFF', '#E3F0FF', '#D9D2FF'], [
    { x: 0.1, y: 0.1, r: 0.6, c: 1, a: 0.9 }, { x: 0.9, y: 0.3, r: 0.55, c: 3, a: 0.8 }, { x: 0.5, y: 1, r: 0.6, c: 2, a: 0.9 },
  ]),
  mesh('pearl', 'Pearl', 'light', ['#FAFAFC', '#FFE3EC', '#DDEBFF', '#FFF3D6', '#E8E0FF'], [
    { x: 0.2, y: 0.25, r: 0.5, c: 1 }, { x: 0.8, y: 0.2, r: 0.5, c: 2 }, { x: 0.75, y: 0.85, r: 0.5, c: 3 }, { x: 0.2, y: 0.85, r: 0.45, c: 4 },
  ]),
  mesh('mint-frost', 'Mint Frost', 'light', ['#E8FFF7', '#96EFCF', '#B3DEFF', '#E0CFFF'], [
    { x: 0.15, y: 0.2, r: 0.6, c: 1, a: 0.9 }, { x: 0.85, y: 0.3, r: 0.55, c: 2, a: 0.9 }, { x: 0.5, y: 1.0, r: 0.6, c: 3, a: 0.9 },
  ]),
  mesh('blush', 'Blush', 'light', ['#FFF4F2', '#FFC9D2', '#FFE0CC', '#F4C6E8'], [
    { x: 0.85, y: 0.1, r: 0.6, c: 1, a: 0.85 }, { x: 0.1, y: 0.9, r: 0.6, c: 2, a: 0.9 }, { x: 0.2, y: 0.15, r: 0.4, c: 3, a: 0.6 },
  ]),
  mesh('sky-pastel', 'Sky Pastel', 'light', ['#EEF4FF', '#A9CBFF', '#D7C4FF', '#BFF0FF'], [
    { x: 0, y: 0.2, r: 0.65, c: 1, a: 0.8 }, { x: 1, y: 0.3, r: 0.6, c: 2, a: 0.8 }, { x: 0.55, y: 1.05, r: 0.6, c: 3, a: 0.85 },
  ]),
  mesh('lemon-sorbet', 'Lemon Sorbet', 'light', ['#FFFBEA', '#FFE68A', '#FFC9A3', '#FFF3B8'], [
    { x: 0.15, y: 0.2, r: 0.6, c: 1, a: 0.8 }, { x: 0.9, y: 0.85, r: 0.6, c: 2, a: 0.8 }, { x: 0.8, y: 0.1, r: 0.45, c: 3 },
  ]),
  mesh('apricot-glow', 'Apricot Glow', 'light', ['#FFF6EE', '#FFC59E', '#FFB3C1', '#FFE2B8'], [
    { x: 0.9, y: 0.9, r: 0.7, c: 1, a: 0.85 }, { x: 0.1, y: 0.95, r: 0.5, c: 2, a: 0.7 }, { x: 0.2, y: 0.1, r: 0.5, c: 3, a: 0.8 },
  ]),
  mesh('iris-frost', 'Iris Frost', 'light', ['#F7F6FF', '#C8C2FF', '#E4DCFF', '#BDD4FF'], [
    { x: 0.5, y: 0, r: 0.7, sx: 1.4, sy: 0.7, c: 1, a: 0.8 }, { x: 0.1, y: 0.9, r: 0.5, c: 3, a: 0.7 }, { x: 0.9, y: 0.85, r: 0.5, c: 2 },
  ]),
  mesh('seafoam', 'Seafoam', 'light', ['#F0FFFB', '#AEEFE2', '#C8F1FF', '#E1FFD9'], [
    { x: 0.1, y: 0.8, r: 0.6, c: 1, a: 0.85 }, { x: 0.85, y: 0.15, r: 0.6, c: 2, a: 0.85 }, { x: 0.8, y: 0.9, r: 0.45, c: 3 },
  ]),
  mesh('sage-cloud', 'Sage Cloud', 'light', ['#F5F7F0', '#CFE0C3', '#E9EFD9', '#DCE8E4'], [
    { x: 0.1, y: 0.15, r: 0.6, c: 1, a: 0.85 }, { x: 0.9, y: 0.9, r: 0.6, c: 3, a: 0.9 }, { x: 0.85, y: 0.15, r: 0.45, c: 2 },
  ]),
  mesh('vanilla-sky', 'Vanilla Sky', 'light', ['#FFFDF6', '#FFE7B8', '#BFE3FF'], [
    { x: 0, y: 1, r: 0.7, c: 1, a: 0.85 }, { x: 1, y: 0, r: 0.7, c: 2, a: 0.85 },
  ]),
  mesh('cloud-dancer', 'Cloud Dancer', 'light', ['#F4F2EF', '#E1DDE8', '#EDE7DF', '#D8DEE9'], [
    { x: 0.2, y: 0.2, r: 0.6, c: 1 }, { x: 0.85, y: 0.8, r: 0.6, c: 3 }, { x: 0.9, y: 0.15, r: 0.4, c: 2 },
  ]),
  linear('cotton-candy', 'Cotton Candy', 'light', 120, ['#FBC2EB', '#A6C1EE']),

  // Dark Glow
  mesh('astro', 'Astro', 'glow', ['#07010F', '#2A0752', '#7A12C9', '#C04BFF', '#FF7AE0'], [
    { x: 1.0, y: 1.05, r: 0.95, sx: 1.25, sy: 0.9, c: 1 }, { x: 0.92, y: 1.0, r: 0.62, sx: 1.35, sy: 0.75, rot: -0.35, c: 2, a: 0.95 },
    { x: 0.98, y: 1.02, r: 0.34, sx: 1.6, sy: 0.7, rot: -0.35, c: 3, a: 0.9 }, { x: 1.02, y: 1.08, r: 0.16, sx: 1.8, sy: 0.8, c: 4, a: 0.7 },
  ], 'screen'),
  mesh('light-wave', 'Light Wave', 'glow', ['#040309', '#1E1470', '#5847F5', '#B9B2FF', '#2C63FF'], [
    { x: 0.5, y: 0.6, r: 0.75, sx: 1.4, sy: 0.55, c: 1 }, { x: 0.3, y: 0.56, r: 0.45, sx: 1.8, sy: 0.32, rot: -0.18, c: 4, a: 0.85 },
    { x: 0.7, y: 0.5, r: 0.45, sx: 1.8, sy: 0.3, rot: 0.22, c: 2, a: 0.9 }, { x: 0.5, y: 0.53, r: 0.32, sx: 2.6, sy: 0.12, rot: -0.04, c: 3, a: 0.85 },
  ], 'screen'),
  mesh('horizon', 'Horizon', 'glow', ['#010208', '#07208F', '#1668FF', '#2FE6C8', '#FF3D9A', '#FFB23F'], [
    { x: 0.5, y: 1.15, r: 1.0, sx: 1.3, sy: 0.7, c: 1 }, { x: 0.5, y: 1.05, r: 0.6, sx: 1.7, sy: 0.42, c: 2 },
    { x: 0.5, y: 1.02, r: 0.38, sx: 2.2, sy: 0.22, c: 3, a: 0.9 }, { x: 0.08, y: 1.0, r: 0.28, sx: 1.3, sy: 0.55, c: 4, a: 0.75 },
    { x: 0.94, y: 1.0, r: 0.28, sx: 1.3, sy: 0.55, c: 5, a: 0.7 },
  ], 'screen'),
  mesh('nebula', 'Nebula', 'glow', ['#06030F', '#5B1A8C', '#1E4DD8', '#FF5FC8'], [
    { x: 0.25, y: 0.3, r: 0.7, c: 1 }, { x: 0.8, y: 0.7, r: 0.7, c: 2, a: 0.9 }, { x: 0.55, y: 0.45, r: 0.35, sx: 1.6, sy: 0.6, rot: 0.5, c: 3, a: 0.6 },
  ], 'screen'),
  mesh('aurora', 'Aurora', 'glow', ['#020A12', '#0B8C9C', '#27E08B', '#6B3BFF'], [
    { x: 0.25, y: 0.3, r: 0.6, sx: 1.8, sy: 0.3, rot: 0.35, c: 1 }, { x: 0.55, y: 0.35, r: 0.5, sx: 2.0, sy: 0.22, rot: 0.25, c: 2, a: 0.85 },
    { x: 0.8, y: 0.7, r: 0.6, c: 3, a: 0.8 },
  ], 'screen'),
  mesh('midnight-bloom', 'Midnight Bloom', 'glow', ['#050816', '#3A1C71', '#D76D77', '#FFAF7B'], [
    { x: 0.9, y: 0.05, r: 0.9, sx: 1.2, c: 1 }, { x: 0.85, y: 0.1, r: 0.5, c: 2, a: 0.9 }, { x: 0.92, y: 0.02, r: 0.25, c: 3, a: 0.85 },
  ], 'screen'),
  mesh('deep-ocean', 'Deep Ocean', 'glow', ['#010B1F', '#0A45F0', '#00CFFF', '#8AF7FF'], [
    { x: 0, y: 0, r: 1.0, sx: 1.2, c: 1 }, { x: 0.05, y: 0.05, r: 0.5, c: 2, a: 0.9 }, { x: 0.02, y: 0.02, r: 0.22, c: 3, a: 0.8 },
  ], 'screen'),
  mesh('magma', 'Magma', 'glow', ['#090202', '#6E0B0B', '#FF4A17', '#FFB36B'], [
    { x: 0.05, y: 1.05, r: 0.95, sx: 1.3, sy: 0.9, c: 1 }, { x: 0.1, y: 1.0, r: 0.55, sx: 1.4, sy: 0.7, rot: 0.35, c: 2, a: 0.9 },
    { x: 0.05, y: 1.02, r: 0.25, sx: 1.6, sy: 0.7, c: 3, a: 0.8 },
  ], 'screen'),
  mesh('solar-flare', 'Solar Flare', 'glow', ['#0A0604', '#6B2A05', '#FF8A1F', '#FFD36B'], [
    { x: 0.5, y: -0.1, r: 0.9, sx: 1.4, sy: 0.7, c: 1 }, { x: 0.5, y: -0.05, r: 0.5, sx: 1.8, sy: 0.45, c: 2, a: 0.9 },
    { x: 0.5, y: -0.02, r: 0.25, sx: 2.2, sy: 0.3, c: 3, a: 0.8 },
  ], 'screen'),
  mesh('emerald-night', 'Emerald Night', 'glow', ['#010F0A', '#0A5E43', '#34D399', '#B5FFE1'], [
    { x: 0.5, y: 1.1, r: 0.9, sx: 1.4, sy: 0.7, c: 1 }, { x: 0.5, y: 1.02, r: 0.45, sx: 1.8, sy: 0.4, c: 2, a: 0.85 },
    { x: 0.5, y: 1.0, r: 0.2, sx: 2.4, sy: 0.3, c: 3, a: 0.7 },
  ], 'screen'),
  mesh('cyber-lime', 'Cyber Lime', 'glow', ['#030806', '#0B4D3A', '#7CFF4F', '#00E0C6'], [
    { x: 0.9, y: 1, r: 0.8, c: 1 }, { x: 0.85, y: 0.95, r: 0.45, sx: 1.5, sy: 0.6, rot: -0.4, c: 3, a: 0.8 },
    { x: 0.95, y: 1.02, r: 0.25, sx: 1.6, sy: 0.6, c: 2, a: 0.6 },
  ], 'screen'),
  mesh('rose-gold', 'Rose Gold', 'glow', ['#1E0A10', '#9C4F5E', '#F2B8B5', '#E5A07A'], [
    { x: 0.2, y: 0.1, r: 0.8, c: 1 }, { x: 0.3, y: 0.15, r: 0.45, sx: 1.6, sy: 0.5, rot: 0.4, c: 2, a: 0.8 }, { x: 0.9, y: 0.9, r: 0.5, c: 3, a: 0.6 },
  ], 'screen'),

  // Vivid & Bold
  mesh('prism', 'Prism', 'vivid', ['#FF2A7F', '#FF7A1A', '#FFD43B', '#10D5F2', '#7B2FF7'], [
    { x: 0.1, y: 0.1, r: 0.55, c: 4, a: 0.85 }, { x: 0.85, y: 0.25, r: 0.6, c: 1 }, { x: 0.65, y: 0.8, r: 0.5, c: 2 },
    { x: 0, y: 1.0, r: 0.5, c: 3 }, { x: 1.0, y: 1.0, r: 0.3, c: 3, a: 0.8 },
  ]),
  linear('electric-blue', 'Electric Blue', 'vivid', 60, ['#1B1BFF', '#0A5BFF', '#00C6FF']),
  mesh('candy-rainbow', 'Candy Rainbow', 'vivid', ['#FFE5F1', '#FF9ACB', '#9AD0FF', '#FFE58A', '#B8F5C8'], [
    { x: 0.1, y: 0.15, r: 0.5, c: 1 }, { x: 0.9, y: 0.2, r: 0.5, c: 2 }, { x: 0.8, y: 0.9, r: 0.5, c: 3 }, { x: 0.15, y: 0.9, r: 0.5, c: 4 },
  ]),
  mesh('sunset', 'Sunset', 'vivid', ['#FF6A3D', '#FF2E63', '#FFC75F', '#8A2BE2'], [
    { x: 0.1, y: 0.15, r: 0.6, c: 1 }, { x: 0.9, y: 0.85, r: 0.6, c: 2 }, { x: 0.95, y: 0.05, r: 0.4, c: 3, a: 0.7 },
  ]),
  mesh('neon-pop', 'Neon Pop', 'vivid', ['#FF3CAC', '#784BA0', '#2B86C5', '#FFE53B'], [
    { x: 0.5, y: 0.5, r: 0.6, c: 1 }, { x: 1, y: 1, r: 0.7, c: 2 }, { x: 1, y: 0, r: 0.35, c: 3, a: 0.8 },
  ]),
  mesh('tropical', 'Tropical', 'vivid', ['#FF9A3C', '#FF3D77', '#00C9A7', '#FFD86B'], [
    { x: 0.9, y: 0.1, r: 0.6, c: 1 }, { x: 0.1, y: 0.95, r: 0.6, c: 2 }, { x: 0.95, y: 0.95, r: 0.35, c: 3, a: 0.8 },
  ]),
  mesh('hyper-blue', 'Hyper Blue', 'vivid', ['#2A2AFF', '#7B2FF7', '#00B3FF', '#9EE8FF'], [
    { x: 0.1, y: 0.1, r: 0.6, c: 1 }, { x: 0.9, y: 0.85, r: 0.6, c: 2 }, { x: 0.8, y: 0.9, r: 0.3, c: 3, a: 0.7 },
  ]),
  mesh('berry-punch', 'Berry Punch', 'vivid', ['#B0126B', '#FF2E63', '#5B0FB0', '#FF7AC6'], [
    { x: 0.85, y: 0.2, r: 0.6, c: 1 }, { x: 0.1, y: 0.9, r: 0.7, c: 2 }, { x: 0.8, y: 0.9, r: 0.35, c: 3, a: 0.8 },
  ]),
  mesh('citrus-burst', 'Citrus Burst', 'vivid', ['#FFD000', '#FF7A00', '#8CFF4F', '#FFF27A'], [
    { x: 0.9, y: 0.9, r: 0.6, c: 1 }, { x: 0.05, y: 0.1, r: 0.5, c: 2, a: 0.8 }, { x: 0.3, y: 0.9, r: 0.4, c: 3, a: 0.8 },
  ]),

  // Chrome & Glass
  mesh('liquid-silver', 'Liquid Silver', 'chrome', ['#E9ECF0', '#FFFFFF', '#B9C1CC', '#94A0B2', '#D5E3F3'], [
    { x: 0.85, y: 0.12, r: 0.5, c: 1 }, { x: 0.3, y: 0.4, r: 0.55, sx: 1.6, sy: 0.28, rot: 0.65, c: 2, a: 0.85 },
    { x: 0.72, y: 0.62, r: 0.55, sx: 1.7, sy: 0.24, rot: -0.55, c: 3, a: 0.6 }, { x: 0.52, y: 0.5, r: 0.38, sx: 2.2, sy: 0.12, rot: 0.6, c: 1 },
    { x: 0.15, y: 0.85, r: 0.5, c: 4, a: 0.8 },
  ]),
  mesh('holo-chrome', 'Holo Chrome', 'chrome', ['#E6E8EE', '#FFFFFF', '#B8C0CC', '#FFD1F0', '#B9F1FF'], [
    { x: 0.35, y: 0.4, r: 0.6, sx: 1.7, sy: 0.25, rot: -0.6, c: 2, a: 0.8 }, { x: 0.5, y: 0.5, r: 0.4, sx: 2.2, sy: 0.1, rot: -0.6, c: 1 },
    { x: 0.65, y: 0.58, r: 0.45, sx: 1.8, sy: 0.18, rot: -0.6, c: 3, a: 0.7 }, { x: 0.3, y: 0.3, r: 0.4, sx: 1.8, sy: 0.16, rot: -0.6, c: 4, a: 0.7 },
    { x: 0.9, y: 0.9, r: 0.5, c: 2, a: 0.6 },
  ]),
  mesh('silk', 'Silk', 'chrome', ['#8FB0DD', '#DDE8F7', '#F3C6A0', '#B5A3EA', '#EE9F78'], [
    { x: 0.15, y: 0.15, r: 0.65, c: 1, a: 0.95 }, { x: 0.62, y: 0.55, r: 0.55, sx: 1.8, sy: 0.24, rot: -0.95, c: 2 },
    { x: 0.52, y: 0.62, r: 0.5, sx: 2.0, sy: 0.18, rot: -1.05, c: 3, a: 0.9 }, { x: 0.7, y: 0.48, r: 0.3, sx: 2.6, sy: 0.08, rot: -0.9, c: 4, a: 0.85 },
    { x: 0.95, y: 0.95, r: 0.45, c: 1, a: 0.6 },
  ]),
  mesh('pearl-silk', 'Pearl Silk', 'chrome', ['#F7F3EF', '#FFFFFF', '#F2D6C9', '#D6E2F2'], [
    { x: 0.4, y: 0.45, r: 0.6, sx: 1.8, sy: 0.25, rot: -0.8, c: 1 }, { x: 0.5, y: 0.55, r: 0.45, sx: 2, sy: 0.15, rot: -0.85, c: 2, a: 0.85 },
    { x: 0.6, y: 0.4, r: 0.45, sx: 2, sy: 0.15, rot: -0.75, c: 3, a: 0.8 }, { x: 0.1, y: 0.9, r: 0.5, c: 1, a: 0.8 },
  ]),
  mesh('frosted-glass', 'Frosted Glass', 'chrome', ['#DCE3EA', '#F7FAFC', '#B7C4D1', '#E9EEF3'], [
    { x: 0.2, y: 0.2, r: 0.6, c: 1 }, { x: 0.8, y: 0.75, r: 0.55, sx: 1.6, sy: 0.4, rot: 0.4, c: 2, a: 0.6 },
    { x: 0.6, y: 0.3, r: 0.4, sx: 2, sy: 0.15, rot: 0.4, c: 3 },
  ]),
  mesh('obsidian', 'Obsidian Chrome', 'chrome', ['#030304', '#3A3E46', '#A3A9B3', '#F2F4F7'], [
    { x: 0.42, y: 0.42, r: 0.8, sx: 1.6, sy: 0.3, rot: -0.9, c: 1, a: 0.9 }, { x: 0.46, y: 0.44, r: 0.55, sx: 2.0, sy: 0.12, rot: -0.9, c: 2, a: 0.8 },
    { x: 0.48, y: 0.45, r: 0.35, sx: 2.6, sy: 0.04, rot: -0.9, c: 3, a: 0.75 },
  ], 'screen'),
  mesh('gunmetal', 'Gunmetal', 'chrome', ['#0C0D10', '#2E323A', '#6B717C', '#B9BEC6'], [
    { x: 0.7, y: 0.35, r: 0.8, sx: 1.5, sy: 0.35, rot: 0.7, c: 1 }, { x: 0.65, y: 0.4, r: 0.5, sx: 2, sy: 0.12, rot: 0.7, c: 2, a: 0.85 },
    { x: 0.63, y: 0.42, r: 0.3, sx: 2.5, sy: 0.04, rot: 0.7, c: 3, a: 0.7 },
  ], 'screen'),

  // Classic Linear
  linear('ocean-breeze', 'Ocean Breeze', 'classic', 135, ['#E0F7FF', '#8FD3FF', '#4A8BFF']),
  linear('sunrise', 'Sunrise', 'classic', 120, ['#FFE1EC', '#FFD6A5', '#FDFFB6']),
  linear('peach-fuzz', 'Peach Fuzz', 'classic', 160, ['#FFF1E6', '#FFCBA4']),
  linear('lagoon', 'Lagoon', 'classic', 120, ['#E3FFE7', '#D9E7FF']),
  radial('mono-light', 'Mono Light', 'classic', ['#FFFFFF', '#E6E6EA']),
  linear('ultraviolet', 'Ultraviolet', 'classic', 160, ['#0D0221', '#3C096C', '#9D4EDD']),
  linear('deep-space', 'Deep Space', 'classic', 160, ['#0F0C29', '#302B63', '#24243E']),
  linear('night-sky', 'Night Sky', 'classic', 180, ['#0B1026', '#2B1B4D', '#5E3A87']),
  radial('graphite', 'Graphite', 'classic', ['#3A3D44', '#0B0C0E']),
  radial('mono-dark', 'Mono Dark', 'classic', ['#2A2A2E', '#050506']),
];

export const DEFAULT_PRESET_ID = 'astro';

export function presetById(id: string): GradientPreset {
  return GRADIENT_PRESETS.find((p) => p.id === id) ?? GRADIENT_PRESETS[0];
}

export const SOLID_SWATCHES = [
  '#000000', '#0B0B0F', '#1C1C22', '#3A3D44', '#F5F5F7', '#FFFFFF',
  '#2A0752', '#1B1BFF', '#00C6FF', '#FF2A7F', '#FF7A1A', '#34D399',
];

/** Default blob centers for mesh colors that have no blob of their own. */
export const MESH_POINTS: [number, number][] = [
  [0.12, 0.18],
  [0.88, 0.16],
  [0.84, 0.86],
  [0.14, 0.84],
  [0.5, 0.5],
];

export function presetToGradient(p: GradientPreset): Gradient {
  return {
    type: p.type,
    colors: [...p.colors],
    angle: p.angle,
    presetId: p.id,
    blobs: p.blobs?.map((b) => ({ ...b })),
    blend: p.blend ?? 'normal',
  };
}
