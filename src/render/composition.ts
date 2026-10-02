import { isTextCard, type Rect, type Scene } from '../types/scene';
import { REF_LONG_EDGE, ratioView } from '../presets/ratios';
import { NO_CHROME, cardChrome } from '../presets/frames';
import {
  chooseAutoFitPartition,
  contentCoefficients,
  fitLayout,
  fitPartition,
  partitionCoefficients,
  solveAutoCanvas,
  type Partition,
  type Placement,
  type ResolvedDirection,
} from './layout';
import { captionGap, layoutCaption, type CaptionLayout } from './text';
import { textCardAspect } from './textCard';
import { isTilted, projectedBounds } from './tilt';

export interface PlacedCaption {
  layout: CaptionLayout;
  x: number;
  y: number;
  w: number;
}

export interface Composition {
  /** Reference canvas size (long edge ≈ 1920). */
  width: number;
  height: number;
  placements: Placement[];
  direction: ResolvedDirection;
  caption: PlacedCaption | null;
}

const NOMINAL_EDGE = 1000;

function shift(r: Rect, dy: number): Rect {
  return { ...r, y: r.y + dy };
}

/** Everything the renderer needs to know about where things go, in reference units. */
export function composeScene(scene: Scene, ctx: CanvasRenderingContext2D): Composition {
  const { layout, style, caption } = scene;
  const aspects = scene.images.map((i) => (isTextCard(i) ? textCardAspect(ctx, i) : i.width / Math.max(1, i.height)));
  const chrome = cardChrome(style);
  const ex = chrome.left + chrome.right, ey = chrome.top + chrome.bottom;
  const pad = layout.padding;

  // A tilted card's projection has a different shape than the card, so lay out slots of the
  // projected shape and size each card to fill its slot.
  const tilted = isTilted(style.tilt);
  const nominal = aspects.map((a) => {
    const iw = a >= 1 ? NOMINAL_EDGE : NOMINAL_EDGE * a;
    const card = { x: 0, y: 0, w: iw + ex, h: iw / a + ey };
    return { card, bounds: tilted ? projectedBounds(card, style.tilt) : { w: card.w, h: card.h } };
  });
  const layoutAspects = tilted ? nominal.map((n) => n.bounds.w / n.bounds.h) : aspects;
  const layoutChrome = tilted ? NO_CHROME : chrome;

  const captionSpace = (width: number) => {
    const c = layoutCaption(ctx, caption, width);
    return c ? c.height + captionGap(caption) : 0;
  };

  // Auto Fit with Auto layout searches for the squarest balanced arrangement and keeps using it below.
  let partition: Partition | null = null;
  let width: number, height: number;
  const aspect = ratioView(scene.ratio, scene.ratioFlipped).aspect;
  if (aspect) {
    width = aspect >= 1 ? REF_LONG_EDGE : REF_LONG_EDGE * aspect;
    height = aspect >= 1 ? REF_LONG_EDGE / aspect : REF_LONG_EDGE;
  } else if (aspects.length === 0) {
    width = REF_LONG_EDGE;
    height = REF_LONG_EDGE * (9 / 16);
  } else {
    if (layout.direction === 'auto') {
      partition = chooseAutoFitPartition(layoutAspects, layout.gap, layoutChrome, pad, captionSpace(REF_LONG_EDGE - 2 * pad), REF_LONG_EDGE);
    }
    const coeff = partition
      ? partitionCoefficients(layoutAspects, partition, layout.gap, layoutChrome)
      : contentCoefficients(layoutAspects, layout.gap, layoutChrome, layout.direction, layout.columns);
    ({ w: width, h: height } = solveAutoCanvas(coeff, pad, captionSpace, REF_LONG_EDGE));
  }

  const boxW = Math.max(1, width - 2 * pad);
  const availH = Math.max(1, height - 2 * pad);
  const hasImages = aspects.length > 0;
  const cap = layoutCaption(ctx, caption, boxW);
  const capGap = cap && hasImages ? captionGap(caption) : 0;
  const capSpace = cap ? cap.height + capGap : 0;
  const onTop = caption.position === 'top';

  const imgBox: Rect = { x: pad, y: pad + (onTop ? capSpace : 0), w: boxW, h: Math.max(1, availH - capSpace) };
  const fit = partition
    ? fitPartition(layoutAspects, imgBox, layout.gap, layoutChrome, partition)
    : fitLayout(layoutAspects, imgBox, layout.gap, layoutChrome, layout.direction, layout.columns);
  const contentH = hasImages ? fit.bounds.h : 0;

  let y = pad + (availH - capSpace - contentH) / 2;
  const span = (w: number) => (hasImages && w <= fit.bounds.w ? { x: fit.bounds.x, w: fit.bounds.w } : { x: pad, w: boxW });

  let placed: PlacedCaption | null = null;
  if (cap && onTop) {
    placed = { layout: cap, y, ...span(cap.width) };
    y += capSpace;
  }

  const dy = y - fit.bounds.y;
  const placements: Placement[] = fit.placements.map((p, i) => {
    if (!tilted) return { card: shift(p.card, dy), image: shift(p.image, dy) };
    const slot = shift(p.card, dy);
    const n = nominal[i];
    const f = Math.min(slot.w / n.bounds.w, slot.h / n.bounds.h);
    const iw = Math.max(1, n.card.w * f - ex);
    const ih = iw / aspects[i];
    const card = { x: slot.x + (slot.w - (iw + ex)) / 2, y: slot.y + (slot.h - (ih + ey)) / 2, w: iw + ex, h: ih + ey };
    return { card, image: { x: card.x + chrome.left, y: card.y + chrome.top, w: iw, h: ih }, slot };
  });
  y += contentH + capGap;

  if (cap && !onTop) placed = { layout: cap, y, ...span(cap.width) };

  return { width, height, placements, direction: fit.direction, caption: placed };
}
