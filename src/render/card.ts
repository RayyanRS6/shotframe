import type { Rect, Style } from '../types/scene';
import type { Placement } from './layout';
import {
  GLASS_PAD,
  MAC_BAR,
  MOBILE_BEZEL,
  PILL_BAR,
  POLAROID_BOTTOM,
  TAB_STRIP,
  TABLET_BEZEL,
  TOOLBAR,
  WINDOWS_BAR,
  frameOuter,
} from '../presets/frames';
import { POLAROID_FONT, ensureFontSpec } from './text';

type Source = CanvasImageSource & { width: number; height: number };
/** What fills a card: a screenshot, a painter (text cards), or nothing yet (a gray placeholder). */
export type CardContent = Source | ((ctx: CanvasRenderingContext2D, r: Rect) => void) | undefined;

const LIGHTS = ['#FF5F57', '#FEBC2E', '#28C840'];
const UI_FONT = '"DM Sans", "Inter", sans-serif';

export interface CardGeometry {
  /** The visible card, excluding stacked layers. */
  body: Rect;
  radius: number;
  /** The body minus the border stroke. */
  inner: Rect;
  innerRadius: number;
}

export function cardGeometry(p: Placement, style: Style): CardGeometry {
  const o = frameOuter(style.frame);
  const body = { x: p.card.x + o.left, y: p.card.y + o.top, w: p.card.w - o.left - o.right, h: p.card.h - o.top - o.bottom };
  const minSide = Math.min(body.w, body.h);
  let radius = style.radius;
  if (style.frame === 'mobile') radius = Math.max(radius, minSide * 0.12);
  if (style.frame === 'tablet') radius = Math.max(radius, minSide * 0.05);
  radius = Math.max(0, Math.min(radius, body.w / 2, body.h / 2));
  const bw = Math.max(0, Math.min(style.border.width, body.w / 2, body.h / 2));
  const inner = { x: body.x + bw, y: body.y + bw, w: body.w - bw * 2, h: body.h - bw * 2 };
  return { body, radius, inner, innerRadius: Math.max(0, radius - bw) };
}

function drawShot(ctx: CanvasRenderingContext2D, content: CardContent, r: Rect) {
  if (typeof content === 'function') {
    content(ctx, r);
  } else if (content) {
    ctx.drawImage(content, r.x, r.y, r.w, r.h);
  } else {
    ctx.fillStyle = '#D9D9DE';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
}

function clippedShot(ctx: CanvasRenderingContext2D, content: CardContent, r: Rect, radius: number) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, Math.max(0, Math.min(radius, r.w / 2, r.h / 2)));
  ctx.clip();
  drawShot(ctx, content, r);
  ctx.restore();
}

function drawLights(ctx: CanvasRenderingContext2D, x: number, cy: number) {
  LIGHTS.forEach((color, i) => {
    ctx.beginPath();
    ctx.arc(x + i * 20, cy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, font: string, color: string, align: CanvasTextAlign) {
  const value = text.trim();
  if (!value || maxWidth < 24) return;
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(truncate(ctx, value, maxWidth), x, y);
}

function bar(ctx: CanvasRenderingContext2D, r: Rect, height: number, fill: string, line: string) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, height);
  ctx.fillStyle = line;
  ctx.fillRect(r.x, r.y + height - 1, r.w, 1);
}

function stroke(ctx: CanvasRenderingContext2D, color: string, width: number, path: () => void) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.restore();
}

/** Blurs whatever is already drawn behind `rect` (inside the current clip). */
function frostedBackdrop(ctx: CanvasRenderingContext2D, rect: Rect) {
  if (!('filter' in ctx)) return;
  const canvas = ctx.canvas;
  const m = ctx.getTransform();
  const blur = 18 * m.a;
  const pad = blur * 2;
  const x0 = Math.max(0, Math.floor(rect.x * m.a + m.e - pad));
  const y0 = Math.max(0, Math.floor(rect.y * m.d + m.f - pad));
  const x1 = Math.min(canvas.width, Math.ceil((rect.x + rect.w) * m.a + m.e + pad));
  const y1 = Math.min(canvas.height, Math.ceil((rect.y + rect.h) * m.d + m.f + pad));
  if (x1 - x0 < 2 || y1 - y0 < 2) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `blur(${blur}px)`;
  ctx.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

function drawStackLayers(ctx: CanvasRenderingContext2D, body: Rect, radius: number, dark: boolean) {
  const layers = [
    { inset: 0.1, lift: 30, fill: dark ? 'rgba(18, 18, 22, 0.35)' : 'rgba(255, 255, 255, 0.35)' },
    { inset: 0.05, lift: 15, fill: dark ? 'rgba(18, 18, 22, 0.6)' : 'rgba(255, 255, 255, 0.62)' },
  ];
  for (const l of layers) {
    ctx.beginPath();
    ctx.roundRect(body.x + body.w * l.inset, body.y - l.lift, body.w * (1 - l.inset * 2), body.h, radius);
    ctx.fillStyle = l.fill;
    ctx.fill();
  }
}

function drawFullBrowser(ctx: CanvasRenderingContext2D, r: Rect, style: Style, dark: boolean) {
  const toolFill = dark ? '#2B2B2E' : '#FFFFFF';
  const muted = dark ? '#A9A9B1' : '#6E6E76';
  ctx.fillStyle = dark ? '#1C1C1F' : '#E6E6EA';
  ctx.fillRect(r.x, r.y, r.w, TAB_STRIP);
  drawLights(ctx, r.x + 22, r.y + TAB_STRIP / 2);

  const tabX = r.x + 86, tabY = r.y + 8, tabH = TAB_STRIP - 8;
  const tabW = Math.min(240, r.w - 120);
  if (tabW > 60) {
    ctx.beginPath();
    ctx.roundRect(tabX, tabY, tabW, tabH, [10, 10, 0, 0]);
    ctx.fillStyle = toolFill;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tabX + 18, tabY + tabH / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#5A5A62' : '#C4C4CC';
    ctx.fill();
    label(ctx, style.frameTitle, tabX + 32, tabY + tabH / 2, tabW - 44, `500 13px ${UI_FONT}`, dark ? '#E4E4EA' : '#3A3A40', 'left');
  }

  ctx.fillStyle = toolFill;
  ctx.fillRect(r.x, r.y + TAB_STRIP, r.w, TOOLBAR);
  ctx.fillStyle = dark ? '#3A3A3E' : '#E4E4E8';
  ctx.fillRect(r.x, r.y + TAB_STRIP + TOOLBAR - 1, r.w, 1);

  const cy = r.y + TAB_STRIP + TOOLBAR / 2;
  const x0 = r.x + 24;
  stroke(ctx, muted, 2, () => {
    ctx.moveTo(x0 + 6, cy);
    ctx.lineTo(x0 - 6, cy);
    ctx.moveTo(x0 - 1, cy - 5);
    ctx.lineTo(x0 - 6, cy);
    ctx.lineTo(x0 - 1, cy + 5);
    ctx.moveTo(x0 + 26, cy);
    ctx.lineTo(x0 + 38, cy);
    ctx.moveTo(x0 + 33, cy - 5);
    ctx.lineTo(x0 + 38, cy);
    ctx.lineTo(x0 + 33, cy + 5);
    ctx.moveTo(x0 + 70, cy - 6);
    ctx.arc(x0 + 64, cy, 6, -Math.PI / 2 + 0.3, Math.PI * 1.35);
  });

  const ax = r.x + 108;
  const aw = r.w - 108 - 52;
  if (aw > 80) {
    ctx.beginPath();
    ctx.roundRect(ax, cy - 16, aw, 32, 16);
    ctx.fillStyle = dark ? '#3A3A3E' : '#F1F1F4';
    ctx.fill();
    stroke(ctx, muted, 1.6, () => {
      ctx.roundRect(ax + 13, cy - 2, 10, 8, 2);
      ctx.moveTo(ax + 15.5, cy - 2);
      ctx.arc(ax + 18, cy - 2, 2.5, Math.PI, 0);
    });
    label(ctx, style.frameUrl, ax + 32, cy + 1, aw - 44, `500 14px ${UI_FONT}`, muted, 'left');
  }
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(r.x + r.w - 26, cy + i * 6, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = muted;
    ctx.fill();
  }
}

function drawWindows(ctx: CanvasRenderingContext2D, r: Rect, style: Style, dark: boolean) {
  bar(ctx, r, WINDOWS_BAR, dark ? '#202020' : '#F3F3F3', dark ? '#2E2E2E' : '#E5E5E5');
  const cy = r.y + WINDOWS_BAR / 2;
  ctx.beginPath();
  ctx.roundRect(r.x + 14, cy - 7, 14, 14, 3);
  ctx.fillStyle = '#0A64D6';
  ctx.fill();
  label(ctx, style.frameTitle, r.x + 38, cy, r.w - 38 - 150, `500 13px ${UI_FONT}`, dark ? '#E6E6E6' : '#1F1F1F', 'left');
  const icon = dark ? '#FFFFFF' : '#1F1F1F';
  const right = r.x + r.w;
  stroke(ctx, icon, 1.2, () => {
    const mx = right - 138 + 23, xx = right - 92 + 23, cx = right - 46 + 23;
    ctx.moveTo(mx - 5, cy);
    ctx.lineTo(mx + 5, cy);
    ctx.rect(xx - 5, cy - 5, 10, 10);
    ctx.moveTo(cx - 5, cy - 5);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.moveTo(cx + 5, cy - 5);
    ctx.lineTo(cx - 5, cy + 5);
  });
}

function drawDevice(ctx: CanvasRenderingContext2D, inner: Rect, innerRadius: number, image: Rect, content: CardContent, bezel: number, dark: boolean, kind: 'mobile' | 'tablet') {
  ctx.fillStyle = dark ? '#0F0F11' : '#E4E4E8';
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  clippedShot(ctx, content, image, Math.max(0, innerRadius - bezel));
  if (kind === 'mobile') {
    const w = Math.min(image.w * 0.3, 130);
    const h = w * 0.3;
    ctx.beginPath();
    ctx.roundRect(image.x + (image.w - w) / 2, image.y + Math.max(8, image.w * 0.025), w, h, h / 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(inner.x + inner.w / 2, inner.y + bezel / 2, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = dark ? '#2A2A2E' : '#BDBDC4';
    ctx.fill();
  }
  stroke(ctx, dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)', 1.5, () => {
    ctx.roundRect(inner.x + 0.75, inner.y + 0.75, inner.w - 1.5, inner.h - 1.5, Math.max(0, innerRadius - 0.75));
  });
}

/**
 * Draws one card with its frame, border and rounded corners, in reference units.
 * `bare` skips the window or device frame and lets the content fill its space.
 */
export function drawCard(ctx: CanvasRenderingContext2D, p: Placement, content: CardContent, style: Style, bare = false) {
  const { body, radius, inner, innerRadius } = cardGeometry(p, style);
  const { image } = p;
  const dark = style.frame === 'mac-dark' || (style.frame !== 'mac-light' && style.frameDark);

  if (style.frame === 'stack') drawStackLayers(ctx, body, radius, dark);

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(body.x, body.y, body.w, body.h, radius);
  ctx.clip();
  if (inner.w < body.w) {
    ctx.fillStyle = style.border.color;
    ctx.fillRect(body.x, body.y, body.w, body.h);
  }
  ctx.beginPath();
  ctx.roundRect(inner.x, inner.y, inner.w, inner.h, innerRadius);
  ctx.clip();

  switch (bare ? 'none' : style.frame) {
    case 'mac-dark':
    case 'mac-light': {
      bar(ctx, inner, MAC_BAR, dark ? '#2B2B2E' : '#F3F3F5', dark ? '#3A3A3E' : '#E2E2E6');
      drawLights(ctx, inner.x + 22, inner.y + MAC_BAR / 2);
      label(ctx, style.frameTitle, inner.x + inner.w / 2, inner.y + MAC_BAR / 2, inner.w - 200, `600 15px ${UI_FONT}`, dark ? '#CFCFD6' : '#55555C', 'center');
      drawShot(ctx, content, image);
      break;
    }
    case 'browser-pill': {
      bar(ctx, inner, PILL_BAR, dark ? '#2B2B2E' : '#F3F3F5', dark ? '#3A3A3E' : '#E2E2E6');
      const cy = inner.y + PILL_BAR / 2;
      drawLights(ctx, inner.x + 24, cy);
      const pillW = Math.min(inner.w - 200, 560);
      if (pillW > 80) {
        const px = inner.x + (inner.w - pillW) / 2;
        ctx.beginPath();
        ctx.roundRect(px, cy - 16, pillW, 32, 16);
        ctx.fillStyle = dark ? '#3A3A3E' : '#FFFFFF';
        ctx.fill();
        label(ctx, style.frameUrl, px + pillW / 2, cy + 1, pillW - 32, `500 15px ${UI_FONT}`, dark ? '#B4B4BC' : '#77777F', 'center');
      }
      drawShot(ctx, content, image);
      break;
    }
    case 'browser-full':
      drawFullBrowser(ctx, inner, style, dark);
      drawShot(ctx, content, image);
      break;
    case 'windows':
      drawWindows(ctx, inner, style, dark);
      drawShot(ctx, content, image);
      break;
    case 'glass': {
      frostedBackdrop(ctx, inner);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
      clippedShot(ctx, content, image, Math.max(0, innerRadius - GLASS_PAD * 0.6));
      stroke(ctx, 'rgba(255, 255, 255, 0.55)', 1.5, () => {
        ctx.roundRect(inner.x + 0.75, inner.y + 0.75, inner.w - 1.5, inner.h - 1.5, Math.max(0, innerRadius - 0.75));
      });
      break;
    }
    case 'mobile':
      drawDevice(ctx, inner, innerRadius, image, content, MOBILE_BEZEL, dark, 'mobile');
      break;
    case 'tablet':
      drawDevice(ctx, inner, innerRadius, image, content, TABLET_BEZEL, dark, 'tablet');
      break;
    case 'polaroid': {
      ctx.fillStyle = '#FBFBF8';
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
      clippedShot(ctx, content, image, Math.min(4, innerRadius));
      ensureFontSpec(POLAROID_FONT, style.frameTitle);
      label(ctx, style.frameTitle, image.x + image.w / 2, image.y + image.h + POLAROID_BOTTOM / 2, image.w - 24, POLAROID_FONT, '#3A3A3A', 'center');
      break;
    }
    default:
      drawShot(ctx, content, bare ? inner : image);
  }

  ctx.restore();
}

/** Rasterizes a card at device resolution, used as the texture for 3D tilt. */
export function renderCardCanvas(p: Placement, content: CardContent, style: Style, scale: number, bare = false): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(p.card.w * scale));
  canvas.height = Math.max(1, Math.ceil(p.card.h * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(scale, 0, 0, scale, -p.card.x * scale, -p.card.y * scale);
  drawCard(ctx, p, content, style, bare);
  return canvas;
}
