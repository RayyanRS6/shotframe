import type { Caption, PillBlock, Scene, TextAlign, TextBlock } from '../types/scene';
import { fontSpec } from '../presets/fonts';

export interface TextLayout {
  block: TextBlock;
  lines: string[];
  width: number;
  height: number;
  lineHeight: number;
}

const listeners = new Set<() => void>();
const requested = new Set<string>();

/** Called whenever a font finishes loading, so the preview can redraw. */
export function onFontLoaded(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** True when the font is ready; otherwise starts loading it and returns false. */
export function ensureFontSpec(spec: string, text: string): boolean {
  if (typeof document === 'undefined' || !document.fonts) return true;
  const sample = text || ' ';
  if (document.fonts.check(spec, sample)) return true;
  const key = `${spec}|${sample}`;
  if (!requested.has(key)) {
    requested.add(key);
    document.fonts
      .load(spec, sample)
      .then(() => listeners.forEach((l) => l()))
      .catch(() => undefined);
  }
  return false;
}

function textOf(block: TextBlock): string {
  return (block as PillBlock).uppercase ? block.content.toUpperCase() : block.content;
}

export function ensureFont(block: TextBlock): boolean {
  return ensureFontSpec(fontSpec(block.font, block.weight, 40), textOf(block));
}

export function isTextVisible(block: TextBlock): boolean {
  return block.enabled && block.content.trim().length > 0;
}

export function captionBlocks(caption: Caption): TextBlock[] {
  return [caption.pill, caption.heading, caption.paragraph].filter(isTextVisible);
}

export const POLAROID_FONT = '500 34px "Caveat", cursive';

export async function loadSceneFonts(scene: Scene): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const cardBlocks = scene.images.flatMap((i) => (i.kind === 'text' ? [i.heading, i.body] : [])).filter(isTextVisible);
  const loads = [...captionBlocks(scene.caption), ...cardBlocks].map((b) => document.fonts.load(fontSpec(b.font, b.weight, 40), textOf(b)));
  if (scene.style.frame === 'polaroid') loads.push(document.fonts.load(POLAROID_FONT, scene.style.frameTitle || ' '));
  await Promise.all(loads.map((p) => p.catch(() => [])));
}

function applyFont(ctx: CanvasRenderingContext2D, block: TextBlock) {
  ctx.font = fontSpec(block.font, block.weight, block.size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${block.letterSpacing * block.size}px`;
}

function resetSpacing(ctx: CanvasRenderingContext2D) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function breakWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const parts: string[] = [];
  let current = '';
  for (const ch of word) {
    if (current && ctx.measureText(current + ch).width > maxWidth) {
      parts.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
}

export function layoutText(ctx: CanvasRenderingContext2D, block: TextBlock, maxWidth: number): TextLayout {
  applyFont(ctx, block);
  const lineHeight = block.size * block.lineHeight;
  const lines: string[] = [];
  const limit = Math.max(maxWidth, block.size);

  for (const paragraph of textOf(block).split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= limit) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width > limit) {
        const pieces = breakWord(ctx, word, limit);
        lines.push(...pieces.slice(0, -1));
        line = pieces[pieces.length - 1] ?? '';
      } else {
        line = word;
      }
    }
    lines.push(line);
  }

  const width = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
  resetSpacing(ctx);
  return { block, lines, width, height: lines.length * lineHeight, lineHeight };
}

export function drawLines(ctx: CanvasRenderingContext2D, t: TextLayout, left: number, top: number, width: number, align: TextAlign) {
  ctx.save();
  applyFont(ctx, t.block);
  ctx.fillStyle = t.block.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align;
  const x = align === 'left' ? left : align === 'right' ? left + width : left + width / 2;
  t.lines.forEach((line, i) => ctx.fillText(line, x, top + t.lineHeight * (i + 0.5)));
  resetSpacing(ctx);
  ctx.restore();
}

export interface CaptionItem {
  kind: 'pill' | 'text';
  layout: TextLayout;
  y: number;
  w: number;
  h: number;
  padX: number;
  padY: number;
}

export interface CaptionLayout {
  items: CaptionItem[];
  width: number;
  height: number;
}

/** Stacks the pill, heading and paragraph; returns null when nothing is visible. */
export function layoutCaption(ctx: CanvasRenderingContext2D, caption: Caption, maxWidth: number): CaptionLayout | null {
  const items: CaptionItem[] = [];
  let y = 0;
  const { pill, heading, paragraph } = caption;

  if (isTextVisible(pill)) {
    const padX = pill.size * 0.85, padY = pill.size * 0.5;
    const layout = layoutText(ctx, pill, maxWidth - padX * 2);
    const item = { kind: 'pill' as const, layout, y, w: layout.width + padX * 2, h: layout.height + padY * 2, padX, padY };
    items.push(item);
    y += item.h;
  }
  if (isTextVisible(heading)) {
    if (items.length) y += Math.max(12, heading.size * 0.35);
    const layout = layoutText(ctx, heading, maxWidth);
    items.push({ kind: 'text', layout, y, w: layout.width, h: layout.height, padX: 0, padY: 0 });
    y += layout.height;
  }
  if (isTextVisible(paragraph)) {
    if (items.length) y += Math.max(10, paragraph.size * (items[items.length - 1].kind === 'pill' ? 0.8 : 0.5));
    const layout = layoutText(ctx, paragraph, maxWidth);
    items.push({ kind: 'text', layout, y, w: layout.width, h: layout.height, padX: 0, padY: 0 });
    y += layout.height;
  }

  if (!items.length) return null;
  return { items, width: Math.max(...items.map((i) => i.w)), height: y };
}

/** Space between the caption and the screenshots. */
export function captionGap(caption: Caption): number {
  return Math.max(32, ...captionBlocks(caption).map((b) => b.size * 0.7));
}

export function drawCaption(ctx: CanvasRenderingContext2D, c: CaptionLayout, caption: Caption, left: number, top: number, width: number) {
  const { align } = caption;
  for (const item of c.items) {
    if (item.kind === 'text') {
      drawLines(ctx, item.layout, left, top + item.y, width, align);
      continue;
    }
    const x = align === 'left' ? left : align === 'right' ? left + width - item.w : left + (width - item.w) / 2;
    ctx.beginPath();
    ctx.roundRect(x, top + item.y, item.w, item.h, Math.min(item.h / 2, caption.pill.size * 1.2));
    ctx.fillStyle = caption.pill.background;
    ctx.fill();
    drawLines(ctx, item.layout, x + item.padX, top + item.y + item.padY, item.w - item.padX * 2, 'center');
  }
}
