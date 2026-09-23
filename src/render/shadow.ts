import type { Style } from '../types/scene';
import { SHADOWS } from '../presets/shadows';

/**
 * Draws only the shadow of a shape. The shape itself is drawn far off-canvas and the shadow is
 * offset back into view, so translucent frames never reveal a dark fill underneath.
 * shadowBlur/shadowOffset ignore the canvas transform, so they are scaled to device px by hand.
 */
export function drawShadow(
  ctx: CanvasRenderingContext2D,
  trace: (ctx: CanvasRenderingContext2D) => void,
  style: Style,
  scale: number,
  canvasWidth: number,
) {
  const layers = SHADOWS[style.shadow.preset];
  if (!layers.length || style.shadow.strength <= 0) return;
  const off = canvasWidth + 2000;

  for (const layer of layers) {
    ctx.save();
    ctx.translate(-off, 0);
    ctx.beginPath();
    trace(ctx);
    ctx.shadowColor = `rgba(24, 16, 10, ${Math.min(1, layer.alpha * style.shadow.strength)})`;
    ctx.shadowBlur = layer.blur * scale;
    ctx.shadowOffsetX = off * scale;
    ctx.shadowOffsetY = layer.y * scale;
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  }
}
