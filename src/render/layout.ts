import type { Direction, Rect } from '../types/scene';
import type { Chrome } from '../presets/frames';

export type ResolvedDirection = 'row' | 'column' | 'grid';

export interface Placement {
  /** Outer card, including frame chrome. */
  card: Rect;
  /** The screenshot itself. */
  image: Rect;
  /** Space a 3D-tilted card's projection may fill (defaults to the card). */
  slot?: Rect;
}

export interface FitResult {
  direction: ResolvedDirection;
  placements: Placement[];
  bounds: Rect;
  imageArea: number;
}

const MIN = 1;

function finish(direction: ResolvedDirection, placements: Placement[]): FitResult {
  if (placements.length === 0) return { direction, placements, bounds: { x: 0, y: 0, w: 0, h: 0 }, imageArea: 0 };
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, area = 0;
  for (const { card, image } of placements) {
    x0 = Math.min(x0, card.x);
    y0 = Math.min(y0, card.y);
    x1 = Math.max(x1, card.x + card.w);
    y1 = Math.max(y1, card.y + card.h);
    area += image.w * image.h;
  }
  return { direction, placements, bounds: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, imageArea: area };
}

function place(x: number, y: number, iw: number, ih: number, c: Chrome): Placement {
  return {
    card: { x, y, w: iw + c.left + c.right, h: ih + c.top + c.bottom },
    image: { x: x + c.left, y: y + c.top, w: iw, h: ih },
  };
}

/** Side by side, all screenshots share one height. */
export function fitRow(aspects: number[], box: Rect, gap: number, c: Chrome): FitResult {
  const n = aspects.length;
  if (n === 0) return finish('row', []);
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const sumA = aspects.reduce((s, a) => s + a, 0);
  const h = Math.max(MIN, Math.min(box.h - ey, (box.w - n * ex - gap * (n - 1)) / sumA));
  const total = h * sumA + n * ex + gap * (n - 1);
  let x = box.x + (box.w - total) / 2;
  const y = box.y + (box.h - (h + ey)) / 2;
  const placements = aspects.map((a) => {
    const p = place(x, y, a * h, h, c);
    x += p.card.w + gap;
    return p;
  });
  return finish('row', placements);
}

/** Stacked, all screenshots share one width. */
export function fitColumn(aspects: number[], box: Rect, gap: number, c: Chrome): FitResult {
  const n = aspects.length;
  if (n === 0) return finish('column', []);
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const sumInv = aspects.reduce((s, a) => s + 1 / a, 0);
  const w = Math.max(MIN, Math.min(box.w - ex, (box.h - n * ey - gap * (n - 1)) / sumInv));
  const total = w * sumInv + n * ey + gap * (n - 1);
  const x = box.x + (box.w - (w + ex)) / 2;
  let y = box.y + (box.h - total) / 2;
  const placements = aspects.map((a) => {
    const p = place(x, y, w, w / a, c);
    y += p.card.h + gap;
    return p;
  });
  return finish('column', placements);
}

export function gridShape(n: number, columns: number) {
  const cols = Math.max(1, Math.min(n, Math.round(columns) || 1));
  return { cols, rows: Math.max(1, Math.ceil(n / cols)) };
}

export function meanAspect(aspects: number[]) {
  return aspects.length ? aspects.reduce((s, a) => s + a, 0) / aspects.length : 1;
}

interface GridRow {
  items: number[];
  /** Sum of aspects in the row. */
  S: number;
  /** Fixed width in the row: chrome and gaps. */
  k: number;
  /** Image height as a linear function of the grid width: h = alpha * W + beta. */
  alpha: number;
  beta: number;
}

/**
 * Justified grid: screenshots in a full row share a height chosen so every row is exactly as wide
 * as the grid, so outer edges line up. A short last row keeps the average row height and is centered.
 * `nominalW` decides whether that short row would overflow and must be justified too.
 */
function gridPlan(aspects: number[], gap: number, c: Chrome, columns: number, nominalW: number) {
  const { cols } = gridShape(aspects.length, columns);
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const rows: GridRow[] = [];
  for (let i = 0; i < aspects.length; i += cols) {
    const items = aspects.slice(i, i + cols);
    const S = items.reduce((s, a) => s + a, 0);
    const k = items.length * ex + gap * (items.length - 1);
    rows.push({ items, S, k, alpha: 1 / S, beta: -k / S });
  }
  const last = rows[rows.length - 1];
  if (rows.length > 1 && last.items.length < cols) {
    const others = rows.slice(0, -1);
    const alpha = others.reduce((s, r) => s + r.alpha, 0) / others.length;
    const beta = others.reduce((s, r) => s + r.beta, 0) / others.length;
    const h = alpha * nominalW + beta;
    if (h * last.S + last.k <= nominalW) Object.assign(last, { alpha, beta });
  }
  const A = rows.reduce((s, r) => s + r.alpha, 0);
  const B = rows.reduce((s, r) => s + r.beta, 0) + rows.length * ey + gap * (rows.length - 1);
  return { rows, A, B };
}

export function fitGrid(aspects: number[], box: Rect, gap: number, c: Chrome, columns: number): FitResult {
  if (aspects.length === 0) return finish('grid', []);
  const ey = c.top + c.bottom, ex = c.left + c.right;
  const plan = gridPlan(aspects, gap, c, columns, box.w);
  const W = Math.max(MIN, Math.min(box.w, (box.h - plan.B) / plan.A));
  const heights = plan.rows.map((r) => Math.max(MIN, r.alpha * W + r.beta));
  const totalH = heights.reduce((s, h) => s + h + ey, 0) + gap * (plan.rows.length - 1);

  let y = box.y + (box.h - totalH) / 2;
  const placements: Placement[] = [];
  plan.rows.forEach((row, ri) => {
    const h = heights[ri];
    const rowW = h * row.S + row.items.length * ex + gap * (row.items.length - 1);
    let x = box.x + (box.w - rowW) / 2;
    for (const a of row.items) {
      const p = place(x, y, a * h, h, c);
      placements.push(p);
      x += p.card.w + gap;
    }
    y += h + ey + gap;
  });
  return finish('grid', placements);
}

/** Auto: whichever arrangement makes the screenshots largest; side-by-side wins near-ties. */
export function fitAuto(aspects: number[], box: Rect, gap: number, c: Chrome): FitResult {
  const row = fitRow(aspects, box, gap, c);
  if (aspects.length < 2) return row;
  const candidates = [row, fitColumn(aspects, box, gap, c)];
  if (aspects.length >= 3) candidates.push(fitGrid(aspects, box, gap, c, Math.ceil(Math.sqrt(aspects.length))));
  const best = Math.max(...candidates.map((r) => r.imageArea));
  return candidates.find((r) => r.imageArea >= best * 0.97) ?? row;
}

export function fitLayout(
  aspects: number[],
  box: Rect,
  gap: number,
  c: Chrome,
  direction: Direction,
  columns: number,
): FitResult {
  switch (direction) {
    case 'row':
      return fitRow(aspects, box, gap, c);
    case 'column':
      return fitColumn(aspects, box, gap, c);
    case 'grid':
      return fitGrid(aspects, box, gap, c, columns);
    default:
      return fitAuto(aspects, box, gap, c);
  }
}

/**
 * For the "auto" ratio there is no box to fit into, so describe the content size as linear in a
 * scale s: width = s*A + B, height = s*C + D.
 */
export function contentCoefficients(aspects: number[], gap: number, c: Chrome, direction: Direction, columns: number) {
  const n = Math.max(1, aspects.length);
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const list = aspects.length ? aspects : [16 / 9];
  let dir: ResolvedDirection;
  if (direction !== 'auto') dir = direction;
  else if (n >= 4) dir = 'grid';
  else dir = meanAspect(list) >= 1.25 ? 'column' : 'row';

  if (dir === 'row') {
    return { A: list.reduce((s, a) => s + a, 0), B: n * ex + gap * (n - 1), C: 1, D: ey };
  }
  if (dir === 'column') {
    return { A: 1, B: ex, C: list.reduce((s, a) => s + 1 / a, 0), D: n * ey + gap * (n - 1) };
  }
  const plan = gridPlan(list, gap, c, direction === 'grid' ? columns : Math.ceil(Math.sqrt(n)), 1000);
  return { A: 1, B: 0, C: plan.A, D: plan.B };
}

/** Canvas size for the "auto" ratio: content + padding + text, with the long edge at `longEdge`. */
export function solveAutoCanvas(
  coeff: { A: number; B: number; C: number; D: number },
  padding: number,
  textHeight: (contentWidth: number) => number,
  longEdge: number,
): { w: number; h: number } {
  let w = longEdge, h = longEdge;
  let t = textHeight(longEdge - 2 * padding);
  for (let i = 0; i < 3; i++) {
    const s = Math.max(40, Math.min((longEdge - coeff.B - 2 * padding) / coeff.A, (longEdge - coeff.D - 2 * padding - t) / coeff.C));
    w = s * coeff.A + coeff.B + 2 * padding;
    h = s * coeff.C + coeff.D + 2 * padding + t;
    t = textHeight(w - 2 * padding);
  }
  h = Math.max(h, coeff.D + 2 * padding + t);
  return { w, h };
}

/** An order-preserving split of the screenshots into justified rows or columns. */
export interface Partition {
  axis: 'rows' | 'cols';
  groups: number[][];
}

interface PartitionLine {
  items: number[];
  /** Sum of aspects (rows) or inverse aspects (cols). */
  S: number;
  /** Shared image height (rows) or width (cols), linear in the content width (rows) or height (cols). */
  alpha: number;
  beta: number;
}

function partitionModel(aspects: number[], p: Partition, gap: number, c: Chrome) {
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const rows = p.axis === 'rows';
  const lines: PartitionLine[] = p.groups.map((items) => {
    const S = items.reduce((s, i) => s + (rows ? aspects[i] : 1 / aspects[i]), 0);
    const k = items.length * (rows ? ex : ey) + gap * (items.length - 1);
    return { items, S, alpha: 1 / S, beta: -k / S };
  });
  const A = lines.reduce((s, l) => s + l.alpha, 0);
  const B = lines.reduce((s, l) => s + l.beta, 0) + lines.length * (rows ? ey : ex) + gap * (lines.length - 1);
  return { lines, A, B };
}

/** Content size as linear in a scale s, like contentCoefficients. */
export function partitionCoefficients(aspects: number[], p: Partition, gap: number, c: Chrome) {
  const { A, B } = partitionModel(aspects, p, gap, c);
  return p.axis === 'rows' ? { A: 1, B: 0, C: A, D: B } : { A, B, C: 1, D: 0 };
}

function partitionDirection(p: Partition): ResolvedDirection {
  if (p.groups.length === 1) return p.axis === 'rows' ? 'row' : 'column';
  if (p.groups.every((g) => g.length === 1)) return p.axis === 'rows' ? 'column' : 'row';
  return 'grid';
}

/** Lays out a partition: every row (or column) spans the same width (or height), centered in the box. */
export function fitPartition(aspects: number[], box: Rect, gap: number, c: Chrome, p: Partition): FitResult {
  if (aspects.length === 0) return finish('grid', []);
  const ex = c.left + c.right, ey = c.top + c.bottom;
  const { lines, A, B } = partitionModel(aspects, p, gap, c);
  const placements: Placement[] = new Array(aspects.length);

  if (p.axis === 'rows') {
    const W = Math.max(MIN, Math.min(box.w, (box.h - B) / A));
    const heights = lines.map((l) => Math.max(MIN, l.alpha * W + l.beta));
    const total = heights.reduce((s, h) => s + h + ey, 0) + gap * (lines.length - 1);
    let y = box.y + (box.h - total) / 2;
    lines.forEach((l, li) => {
      const h = heights[li];
      const rowW = h * l.S + l.items.length * ex + gap * (l.items.length - 1);
      let x = box.x + (box.w - rowW) / 2;
      for (const i of l.items) {
        placements[i] = place(x, y, aspects[i] * h, h, c);
        x += placements[i].card.w + gap;
      }
      y += h + ey + gap;
    });
  } else {
    const H = Math.max(MIN, Math.min(box.h, (box.w - B) / A));
    const widths = lines.map((l) => Math.max(MIN, l.alpha * H + l.beta));
    const total = widths.reduce((s, w) => s + w + ex, 0) + gap * (lines.length - 1);
    let x = box.x + (box.w - total) / 2;
    lines.forEach((l, li) => {
      const w = widths[li];
      const colH = w * l.S + l.items.length * ey + gap * (l.items.length - 1);
      let y = box.y + (box.h - colH) / 2;
      for (const i of l.items) {
        placements[i] = place(x, y, w, w / aspects[i], c);
        y += placements[i].card.h + gap;
      }
      x += w + ex + gap;
    });
  }
  return finish(partitionDirection(p), placements);
}

/** Every order-preserving way to split n items into consecutive groups (evenly sized groups beyond 9). */
function candidateGroups(n: number): number[][][] {
  const out: number[][][] = [];
  if (n <= 9) {
    for (let mask = 0; mask < 1 << (n - 1); mask++) {
      const groups: number[][] = [[0]];
      for (let i = 1; i < n; i++) {
        if (mask & (1 << (i - 1))) groups.push([i]);
        else groups[groups.length - 1].push(i);
      }
      out.push(groups);
    }
  } else {
    for (let size = 1; size <= n; size++) {
      const groups: number[][] = [];
      for (let i = 0; i < n; i += size) groups.push(Array.from({ length: Math.min(size, n - i) }, (_, j) => i + j));
      out.push(groups);
    }
  }
  return out;
}

/** How much a lopsided layout (one screenshot far bigger than another) is penalized against squareness. */
const BALANCE_WEIGHT = 0.25;
/** A later candidate must beat the best by this much, so near-ties keep simpler row layouts. */
const TIE_MARGIN = 0.01;

/**
 * Auto Fit: of every order-preserving arrangement in justified rows or columns, pick the one whose
 * finished canvas (padding and caption included) is closest to square, penalizing arrangements that
 * make some screenshots much bigger than others.
 */
export function chooseAutoFitPartition(
  aspects: number[],
  gap: number,
  c: Chrome,
  padding: number,
  captionHeight: number,
  longEdge: number,
): Partition {
  let best: Partition = { axis: 'rows', groups: [aspects.map((_, i) => i)] };
  let bestScore = Infinity;

  for (const axis of ['rows', 'cols'] as const) {
    for (const groups of candidateGroups(aspects.length)) {
      const p: Partition = { axis, groups };
      const { lines, A, B } = partitionModel(aspects, p, gap, c);
      const coeff = axis === 'rows' ? { A: 1, B: 0, C: A, D: B } : { A, B, C: 1, D: 0 };
      const s = Math.min((longEdge - coeff.B - 2 * padding) / coeff.A, (longEdge - coeff.D - 2 * padding - captionHeight) / coeff.C);
      if (!(s > 0)) continue;

      let minArea = Infinity, maxArea = 0, valid = true;
      for (const l of lines) {
        const size = l.alpha * s + l.beta;
        if (size <= 0) {
          valid = false;
          break;
        }
        for (const i of l.items) {
          const area = axis === 'rows' ? aspects[i] * size * size : (size * size) / aspects[i];
          minArea = Math.min(minArea, area);
          maxArea = Math.max(maxArea, area);
        }
      }
      if (!valid) continue;

      const w = s * coeff.A + coeff.B + 2 * padding;
      const h = s * coeff.C + coeff.D + 2 * padding + captionHeight;
      const score = Math.abs(Math.log(w / h)) + BALANCE_WEIGHT * Math.log(maxArea / minArea);
      if (score < bestScore - TIE_MARGIN) {
        bestScore = score;
        best = p;
      }
    }
  }
  return best;
}
