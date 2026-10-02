export type RatioId = 'auto' | '16:9' | '1:1' | '4:3' | '2:1' | '3:2' | '4:5' | '9:16' | '3:1';
export type Direction = 'auto' | 'row' | 'column' | 'grid';
export type GradientType = 'linear' | 'radial' | 'mesh';
export type BackgroundKind = 'gradient' | 'solid' | 'image';
export type ShadowPreset = 'none' | 'soft' | 'medium' | 'hard' | 'layered';
export type FrameKind =
  | 'none'
  | 'mac-dark'
  | 'mac-light'
  | 'browser-pill'
  | 'browser-full'
  | 'glass'
  | 'mobile'
  | 'windows'
  | 'tablet'
  | 'polaroid'
  | 'stack';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom';
/** 'auto' hugs the text; the rest are fixed width:height shapes. */
export type TextCardShape = 'auto' | '1:1' | '4:3' | '4:5' | '16:9' | '9:16';
export type CaptionPosition = 'top' | 'bottom';
export type ExportTier = 'hd' | '2k' | 'uhd';
export type ExportFormat = 'png' | 'jpeg' | 'webp';
export type FontId =
  | 'plus-jakarta-sans'
  | 'anthropic-serif'
  | 'playfair-display'
  | 'outfit'
  | 'space-grotesk'
  | 'jetbrains-mono'
  | 'caveat'
  | 'syne'
  | 'poppins'
  | 'montserrat'
  | 'inter'
  | 'dm-sans'
  | 'manrope'
  | 'fraunces'
  | 'instrument-serif';

/** Metadata for an uploaded screenshot. The Blob lives in IndexedDB, the decoded bitmap in memory. */
export interface ImageItem {
  /** Missing on screenshots saved before text cards existed. */
  kind?: 'image';
  id: string;
  name: string;
  width: number;
  height: number;
}

/** A soft light blob in a mesh gradient. Positions are fractions of the canvas. */
export interface MeshBlob {
  x: number;
  y: number;
  /** Radius as a fraction of the canvas long edge. */
  r: number;
  /** Stretch along the blob's own axes (ellipses, streaks). */
  sx?: number;
  sy?: number;
  /** Rotation in radians. */
  rot?: number;
  /** Index into the gradient's colors. */
  c: number;
  /** Opacity 0..1. */
  a?: number;
}

export interface Gradient {
  type: GradientType;
  /** For mesh gradients colors[0] is the base fill. */
  colors: string[];
  /** Degrees, CSS convention (0 = to top, 90 = to right). Linear only. */
  angle: number;
  presetId: string | null;
  blobs?: MeshBlob[];
  /** 'screen' makes blobs glow on dark bases. */
  blend?: 'normal' | 'screen';
}

export interface Background {
  kind: BackgroundKind;
  gradient: Gradient;
  solid: string;
  image: { id: string | null; blur: number; dim: number };
  /** Film grain strength 0..1, applied over any background. */
  grain: number;
}

/** All lengths are reference px on a canvas whose long edge is 1920. */
export interface Layout {
  direction: Direction;
  columns: number;
  padding: number;
  gap: number;
}

export interface Tilt {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
}

export interface Style {
  radius: number;
  border: { width: number; color: string };
  shadow: { preset: ShadowPreset; strength: number };
  frame: FrameKind;
  /** Window title (macOS, Windows, browser tab) or Polaroid caption. */
  frameTitle: string;
  frameUrl: string;
  /** Dark appearance for frames that come in both. */
  frameDark: boolean;
  tilt: Tilt;
}

export interface TextBlock {
  enabled: boolean;
  content: string;
  font: FontId;
  weight: number;
  size: number;
  color: string;
  lineHeight: number;
  /** In em. */
  letterSpacing: number;
}

export interface PillBlock extends TextBlock {
  background: string;
  uppercase: boolean;
}

/**
 * A card that holds text instead of a screenshot. It is laid out, framed and tilted like one,
 * and scales with its slot: sizes are px on a card `width` wide.
 */
export interface TextCardItem {
  kind: 'text';
  id: string;
  heading: TextBlock;
  body: TextBlock;
  align: TextAlign;
  verticalAlign: VerticalAlign;
  background: string;
  shape: TextCardShape;
  width: number;
  padding: number;
  /** Also draw the window or device frame around the card (off: the card fills the frame's space). */
  frame: boolean;
}

/** One card on the canvas. */
export type SceneItem = ImageItem | TextCardItem;

export function isTextCard(item: SceneItem): item is TextCardItem {
  return item.kind === 'text';
}

/** Pill, heading and paragraph stacked above or below the screenshots. */
export interface Caption {
  position: CaptionPosition;
  align: TextAlign;
  pill: PillBlock;
  heading: TextBlock;
  paragraph: TextBlock;
}

export interface ExportSettings {
  tier: ExportTier;
  format: ExportFormat;
  quality: number;
}

export interface Scene {
  /** Screenshots and text cards, in layout order (named before text cards existed). */
  images: SceneItem[];
  ratio: RatioId;
  /** Swap width and height of the chosen ratio (4:3 → 3:4). */
  ratioFlipped: boolean;
  background: Background;
  layout: Layout;
  style: Style;
  caption: Caption;
  export: ExportSettings;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
