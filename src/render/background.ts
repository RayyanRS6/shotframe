import type { Background, Gradient, MeshBlob } from '../types/scene';
import { MESH_POINTS } from '../presets/gradients';
import { withAlpha } from '../utils/color';

type Bitmaps = Map<string, CanvasImageSource & { width: number; height: number }>;

/** Roughly Gaussian falloff so blobs melt into each other. */
const FALLOFF: [number, number][] = [
  [0, 1],
  [0.22, 0.8],
  [0.45, 0.5],
  [0.7, 0.2],
  [1, 0],
];

function drawBlob(ctx: CanvasRenderingContext2D, blob: MeshBlob, color: string, W: number, H: number) {
  const r = blob.r * Math.max(W, H);
  if (r <= 0) return;
  const alpha = blob.a ?? 1;
  ctx.save();
  ctx.translate(blob.x * W, blob.y * H);
  ctx.rotate(blob.rot ?? 0);
  ctx.scale(blob.sx ?? 1, blob.sy ?? 1);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  for (const [stop, k] of FALLOFF) grad.addColorStop(stop, withAlpha(color, alpha * k));
  ctx.fillStyle = grad;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

export function paintGradient(ctx: CanvasRenderingContext2D, g: Gradient, W: number, H: number) {
  const colors = g.colors.length ? g.colors : ['#0B0B0F'];
  const addStops = (grad: CanvasGradient) =>
    colors.forEach((c, i) => grad.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), c));

  if (g.type === 'linear') {
    const a = (g.angle * Math.PI) / 180;
    const sin = Math.sin(a), cos = Math.cos(a);
    const len = Math.abs(W * sin) + Math.abs(H * cos);
    const cx = W / 2, cy = H / 2;
    const grad = ctx.createLinearGradient(cx - (sin * len) / 2, cy + (cos * len) / 2, cx + (sin * len) / 2, cy - (cos * len) / 2);
    addStops(grad);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  if (g.type === 'radial') {
    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
    addStops(grad);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // Mesh: a base fill with soft light blobs on top.
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = g.blend === 'screen' ? 'screen' : 'source-over';
  const blobs = g.blobs ?? [];
  for (const b of blobs) if (b.c < colors.length) drawBlob(ctx, b, colors[b.c], W, H);
  // Colors without a blob of their own (e.g. added by the user) get a default spot.
  const placed = new Set(blobs.map((b) => b.c));
  colors.forEach((c, i) => {
    if (i === 0 || placed.has(i)) return;
    const [x, y] = MESH_POINTS[(i - 1) % MESH_POINTS.length];
    drawBlob(ctx, { x, y, r: 0.75, c: i }, c, W, H);
  });
  ctx.restore();
}

let noise: HTMLCanvasElement | null = null;

/** Deterministic grayscale noise tile, so repeated exports are identical. */
function noiseTile(): HTMLCanvasElement {
  if (noise) return noise;
  const size = 256;
  noise = document.createElement('canvas');
  noise.width = noise.height = size;
  const c = noise.getContext('2d')!;
  const img = c.createImageData(size, size);
  let seed = 0x2f6b3a1d;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const v = seed >>> 24;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return noise;
}

function drawGrain(ctx: CanvasRenderingContext2D, amount: number, W: number, H: number, scale: number) {
  if (!(amount > 0)) return;
  const pattern = ctx.createPattern(noiseTile(), 'repeat');
  if (!pattern) return;
  ctx.save();
  // Grain dots never get smaller than a device pixel, so the small preview reads like the export.
  const deviceSpace = scale < 1;
  if (deviceSpace) ctx.setTransform(1, 0, 0, 1, 0, 0);
  const k = deviceSpace ? scale : 1;
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(1, amount);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W * k + 1, H * k + 1);
  ctx.restore();
}

/** Draws in reference units; `scale` converts reference px to device px (for blur and grain). */
export function drawBackground(ctx: CanvasRenderingContext2D, bg: Background, W: number, H: number, scale: number, bitmaps: Bitmaps) {
  if (bg.kind === 'solid') {
    ctx.fillStyle = bg.solid;
    ctx.fillRect(0, 0, W, H);
  } else if (bg.kind === 'image') {
    ctx.fillStyle = bg.solid;
    ctx.fillRect(0, 0, W, H);
    const bmp = bg.image.id ? bitmaps.get(bg.image.id) : undefined;
    if (bmp) {
      const pw = W * scale, ph = H * scale;
      const blur = Math.max(0, bg.image.blur * scale);
      const bleed = blur * 2;
      const cover = Math.max((pw + bleed * 2) / bmp.width, (ph + bleed * 2) / bmp.height);
      const dw = bmp.width * cover, dh = bmp.height * cover;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (blur > 0 && 'filter' in ctx) ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(bmp, (pw - dw) / 2, (ph - dh) / 2, dw, dh);
      ctx.restore();
      if (bg.image.dim > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${bg.image.dim})`;
        ctx.fillRect(0, 0, W, H);
      }
    }
  } else {
    paintGradient(ctx, bg.gradient, W, H);
  }
  drawGrain(ctx, bg.grain, W, H, scale);
}

const thumbs = new Map<string, string>();

/** Small rendered preview of a gradient, drawn by the same code as the export. */
export function gradientThumbnail(g: Gradient, w = 160, h = 100): string {
  const key = JSON.stringify([g.type, g.colors, g.angle, g.blobs, g.blend, w, h]);
  let url = thumbs.get(key);
  if (!url) {
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    paintGradient(ctx, g, w, h);
    url = canvas.toDataURL('image/jpeg', 0.9);
    thumbs.set(key, url);
  }
  return url;
}
