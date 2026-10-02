import type { Rect, TextCardItem, TextCardShape, VerticalAlign } from '../types/scene';
import { drawLines, ensureFont, isTextVisible, layoutText, type TextLayout } from './text';

const SHAPE_ASPECT: Record<TextCardShape, number | null> = {
  auto: null,
  '1:1': 1,
  '4:3': 4 / 3,
  '4:5': 4 / 5,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

const VERTICAL: Record<VerticalAlign, number> = { top: 0, middle: 0.5, bottom: 1 };

export interface TextCardLayout {
  blocks: { layout: TextLayout; y: number }[];
  /** The card at its own scale, `card.width` wide. */
  width: number;
  height: number;
  /** Height of the stacked heading and body. */
  textHeight: number;
}

/** Wraps the heading and body at the card's own width; auto cards are as tall as their text. */
export function layoutTextCard(ctx: CanvasRenderingContext2D, card: TextCardItem): TextCardLayout {
  const pad = Math.max(0, card.padding);
  const maxWidth = Math.max(40, card.width - pad * 2);
  const blocks: TextCardLayout['blocks'] = [];
  let y = 0;
  if (isTextVisible(card.heading)) {
    const layout = layoutText(ctx, card.heading, maxWidth);
    blocks.push({ layout, y });
    y += layout.height;
  }
  if (isTextVisible(card.body)) {
    if (blocks.length) y += Math.max(10, card.body.size * 0.6);
    const layout = layoutText(ctx, card.body, maxWidth);
    blocks.push({ layout, y });
    y += layout.height;
  }
  const aspect = SHAPE_ASPECT[card.shape] ?? null;
  const height = aspect ? card.width / aspect : blocks.length ? y + pad * 2 : card.width / 2;
  return { blocks, width: card.width, height: Math.max(1, height), textHeight: y };
}

export function textCardAspect(ctx: CanvasRenderingContext2D, card: TextCardItem): number {
  const l = layoutTextCard(ctx, card);
  return l.width / l.height;
}

/** True when the card's fonts are ready; otherwise starts loading them. */
export function textCardFontsReady(card: TextCardItem): boolean {
  return [card.heading, card.body].filter(isTextVisible).map(ensureFont).every(Boolean);
}

/**
 * Fills `r` with the card and sets its text, scaled so the card fits inside `r`. Any extra room
 * (a frame's space, when the frame is skipped) goes to the alignment. Fixed shapes shrink text that overflows.
 */
export function drawTextCard(ctx: CanvasRenderingContext2D, card: TextCardItem, r: Rect) {
  ctx.fillStyle = card.background;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const l = layoutTextCard(ctx, card);
  const k = Math.min(r.w / l.width, r.h / l.height);
  if (!l.blocks.length || !(k > 0)) return;

  const pad = Math.max(0, card.padding);
  const areaW = Math.max(1, r.w / k - pad * 2);
  const areaH = Math.max(1, r.h / k - pad * 2);
  const fit = Math.min(1, areaH / l.textHeight);
  const top = (areaH - l.textHeight * fit) * (VERTICAL[card.verticalAlign] ?? 0.5);

  ctx.save();
  ctx.translate(r.x + pad * k, r.y + (pad + top) * k);
  ctx.scale(k * fit, k * fit);
  for (const b of l.blocks) drawLines(ctx, b.layout, 0, b.y, areaW / fit, card.align);
  ctx.restore();
}
