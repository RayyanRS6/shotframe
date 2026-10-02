import type { Gradient, MeshBlob, Scene, SceneItem, TextBlock, TextCardItem } from '../types/scene';
import { DEFAULT_PRESET_ID, presetById, presetToGradient } from '../presets/gradients';
import { FRAME_OPTIONS } from '../presets/frames';
import { FONTS } from '../presets/fonts';

export const DEFAULT_SCENE: Scene = {
  images: [],
  ratio: '16:9',
  ratioFlipped: false,
  background: {
    kind: 'gradient',
    gradient: presetToGradient(presetById(DEFAULT_PRESET_ID)),
    solid: '#0B0B0F',
    image: { id: null, blur: 0, dim: 0 },
    grain: 0.45,
  },
  layout: { direction: 'auto', columns: 2, padding: 120, gap: 64 },
  style: {
    radius: 20,
    border: { width: 0, color: '#EFE7DA' },
    shadow: { preset: 'layered', strength: 1 },
    frame: 'none',
    frameTitle: 'Dashboard — Comparison',
    frameUrl: 'yourproduct.com',
    frameDark: false,
    tilt: { rotateX: 0, rotateY: 0, rotateZ: 0, perspective: 2400 },
  },
  caption: {
    position: 'top',
    align: 'center',
    pill: {
      enabled: false,
      content: 'UI/UX Comparison',
      font: 'plus-jakarta-sans',
      weight: 700,
      size: 22,
      color: '#FFFFFF',
      lineHeight: 1.2,
      letterSpacing: 0.08,
      background: '#7B5CE6',
      uppercase: true,
    },
    heading: {
      enabled: false,
      content: 'Dashboard Evolution: Light vs Dark',
      font: 'plus-jakarta-sans',
      weight: 800,
      size: 68,
      color: '#FFFFFF',
      lineHeight: 1.12,
      letterSpacing: -0.02,
    },
    paragraph: {
      enabled: false,
      content: 'Streamlined metric cards and a redesigned analytics chart for SaaS power users.',
      font: 'plus-jakarta-sans',
      weight: 400,
      size: 30,
      color: '#E7E2EC',
      lineHeight: 1.45,
      letterSpacing: 0,
    },
  },
  export: { tier: 'uhd', format: 'png', quality: 0.92 },
};

export const DEFAULT_TEXT_CARD: Omit<TextCardItem, 'id'> = {
  kind: 'text',
  heading: {
    enabled: true,
    content: 'What changed',
    font: 'plus-jakarta-sans',
    weight: 800,
    size: 56,
    color: '#151515',
    lineHeight: 1.12,
    letterSpacing: -0.02,
  },
  body: {
    enabled: true,
    content: 'Cleaner metric cards, a calmer palette and a chart you can read at a glance.',
    font: 'plus-jakarta-sans',
    weight: 400,
    size: 30,
    color: '#55555C',
    lineHeight: 1.45,
    letterSpacing: 0,
  },
  align: 'left',
  verticalAlign: 'middle',
  background: '#FFFFFF',
  shape: 'auto',
  width: 800,
  padding: 64,
  frame: false,
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Deep-merge saved data over defaults so older saves keep working when fields are added. */
function merge<T>(base: T, saved: unknown): T {
  if (!isObj(base) || !isObj(saved)) {
    if (base === null) return (saved === undefined ? null : saved) as T;
    if (saved === undefined || saved === null) return base;
    if (Array.isArray(base)) return (Array.isArray(saved) ? saved : base) as T;
    return (typeof saved === typeof base ? saved : base) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) out[key] = merge((base as Record<string, unknown>)[key], saved[key]);
  return out as T;
}

/** A saved gradient is taken as a whole — mixing in the default preset's blobs would change its look. */
function savedGradient(saved: unknown): Gradient | null {
  if (!isObj(saved) || !isObj(saved.background) || !isObj(saved.background.gradient)) return null;
  const g = saved.background.gradient;
  const colors = Array.isArray(g.colors) ? g.colors.filter((c): c is string => typeof c === 'string') : [];
  if (!colors.length) return null;
  return {
    type: g.type === 'radial' || g.type === 'mesh' ? g.type : 'linear',
    colors,
    angle: typeof g.angle === 'number' ? g.angle : 135,
    presetId: typeof g.presetId === 'string' ? g.presetId : null,
    blobs: Array.isArray(g.blobs) ? (g.blobs as MeshBlob[]) : undefined,
    blend: g.blend === 'screen' ? 'screen' : 'normal',
  };
}

/** Older saves had a top/bottom text pair; carry their words over into the caption. */
function legacyText(saved: unknown, base: TextBlock): TextBlock {
  if (!isObj(saved)) return base;
  return {
    ...base,
    enabled: saved.enabled === true,
    content: typeof saved.content === 'string' ? saved.content : base.content,
    size: typeof saved.size === 'number' ? saved.size : base.size,
    weight: typeof saved.weight === 'number' ? saved.weight : base.weight,
    color: typeof saved.color === 'string' ? saved.color : base.color,
  };
}

const validFont = (b: TextBlock, fallback: TextBlock) => (FONTS.some((f) => f.id === b.font) ? b.font : fallback.font);

/** Saved items are kept as they are, except text cards, which get fields added since they were saved. */
function savedItems(items: SceneItem[]): SceneItem[] {
  return items.flatMap((item): SceneItem[] => {
    if (!isObj(item) || typeof item.id !== 'string') return [];
    if (item.kind !== 'text') return [item];
    const card = { ...merge(DEFAULT_TEXT_CARD, item), id: item.id };
    card.heading = { ...card.heading, font: validFont(card.heading, DEFAULT_TEXT_CARD.heading) };
    card.body = { ...card.body, font: validFont(card.body, DEFAULT_TEXT_CARD.body) };
    return [card];
  });
}

export function mergeScene(saved: unknown): Scene {
  const scene = merge(DEFAULT_SCENE, saved);
  const gradient = savedGradient(saved);
  if (gradient) scene.background = { ...scene.background, gradient };
  scene.images = savedItems(scene.images);
  if (!isObj(saved)) return scene;

  const savedFrame = isObj(saved.style) ? saved.style.frame : undefined;
  if (savedFrame === 'browser-light' || savedFrame === 'browser-dark') {
    scene.style = { ...scene.style, frame: 'browser-pill', frameDark: savedFrame === 'browser-dark' };
  } else if (!FRAME_OPTIONS.some((f) => f.value === scene.style.frame)) {
    scene.style = { ...scene.style, frame: 'none' };
  }

  if (!isObj(saved.caption) && isObj(saved.texts)) {
    const heading = legacyText(saved.texts.top, scene.caption.heading);
    const paragraph = legacyText(saved.texts.bottom, scene.caption.paragraph);
    scene.caption = { ...scene.caption, heading, paragraph, position: heading.enabled || !paragraph.enabled ? 'top' : 'bottom' };
  }

  const c = scene.caption;
  scene.caption = {
    ...c,
    pill: { ...c.pill, font: validFont(c.pill, DEFAULT_SCENE.caption.pill) },
    heading: { ...c.heading, font: validFont(c.heading, DEFAULT_SCENE.caption.heading) },
    paragraph: { ...c.paragraph, font: validFont(c.paragraph, DEFAULT_SCENE.caption.paragraph) },
  };
  return scene;
}
