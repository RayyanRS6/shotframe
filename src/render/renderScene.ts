import { isTextCard, type Scene, type SceneItem, type Style } from '../types/scene';
import type { Placement } from './layout';
import { composeScene, type Composition } from './composition';
import { drawBackground } from './background';
import { cardGeometry, drawCard, renderCardCanvas, type CardContent } from './card';
import { drawShadow } from './shadow';
import { captionBlocks, drawCaption, ensureFont } from './text';
import { drawTextCard, textCardFontsReady } from './textCard';
import { isTilted, projectedOutline, tiltSupported, warpCard } from './tilt';

export type Bitmaps = Map<string, ImageBitmap>;

const cardCache = new Map<string, HTMLCanvasElement>();

function cardContent(item: SceneItem, bitmaps: Bitmaps): CardContent {
  return isTextCard(item) ? (ctx, r) => drawTextCard(ctx, item, r) : bitmaps.get(item.id);
}

function cachedCard(item: SceneItem, p: Placement, content: CardContent, bare: boolean, style: Style, scale: number) {
  const key = [
    item.id,
    !!content,
    // Text cards are redrawn when their text, style or font readiness changes.
    isTextCard(item) ? `${JSON.stringify(item)}|${textCardFontsReady(item)}|${bare}` : '',
    style.frame,
    style.radius,
    style.border.width,
    style.border.color,
    style.frameTitle,
    style.frameUrl,
    style.frameDark,
    p.card.w.toFixed(2),
    p.card.h.toFixed(2),
    scale.toFixed(4),
  ].join('|');
  let canvas = cardCache.get(key);
  if (!canvas) {
    canvas = renderCardCanvas(p, content, style, scale, bare);
    cardCache.set(key, canvas);
    if (cardCache.size > 24) cardCache.delete(cardCache.keys().next().value!);
  }
  return canvas;
}

/**
 * The single renderer used by both the live preview and export.
 * Draws the scene into a pixelW × pixelH canvas.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  bitmaps: Bitmaps,
  pixelW: number,
  pixelH: number,
  composition?: Composition,
): Composition {
  const c = composition ?? composeScene(scene, ctx);
  const sx = pixelW / c.width;
  const sy = pixelH / c.height;
  const { style } = scene;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, pixelW, pixelH);
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawBackground(ctx, scene.background, c.width, c.height, sx, bitmaps);

  const tilted = isTilted(style.tilt) && tiltSupported();

  for (const p of c.placements) {
    const { body, radius } = cardGeometry(p, style);
    if (tilted) {
      const outline = projectedOutline(p.card, body, radius, style.tilt, p.slot);
      drawShadow(
        ctx,
        (cx) => {
          outline.forEach((pt, i) => (i ? cx.lineTo(pt.x, pt.y) : cx.moveTo(pt.x, pt.y)));
          cx.closePath();
        },
        style,
        sx,
        c.width,
      );
    } else {
      drawShadow(ctx, (cx) => cx.roundRect(body.x, body.y, body.w, body.h, radius), style, sx, c.width);
    }
  }

  c.placements.forEach((p, i) => {
    const item = scene.images[i];
    const content = item ? cardContent(item, bitmaps) : undefined;
    const bare = !!item && isTextCard(item) && !item.frame;
    // Starts loading a text card's fonts; the preview redraws when they arrive.
    if (item && isTextCard(item)) textCardFontsReady(item);
    if (tilted && item) {
      const out = warpCard(cachedCard(item, p, content, bare, style, sx), p.card, style.tilt, sx, p.slot);
      if (out) {
        ctx.drawImage(out.canvas, out.x, out.y, out.w, out.h);
        return;
      }
    }
    drawCard(ctx, p, content, style, bare);
  });

  if (c.caption) {
    captionBlocks(scene.caption).forEach(ensureFont);
    drawCaption(ctx, c.caption.layout, scene.caption, c.caption.x, c.caption.y, c.caption.w);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return c;
}
