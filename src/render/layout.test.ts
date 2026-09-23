import { describe, expect, it } from 'vitest';
import { fitAuto, fitColumn, fitGrid, fitRow, solveAutoCanvas, contentCoefficients } from './layout';
import { NO_CHROME } from '../presets/frames';

const box = { x: 96, y: 96, w: 1728, h: 888 };
const inside = (r: { x: number; y: number; w: number; h: number }) =>
  r.x >= box.x - 1e-6 && r.y >= box.y - 1e-6 && r.x + r.w <= box.x + box.w + 1e-6 && r.y + r.h <= box.y + box.h + 1e-6;

describe('fitRow', () => {
  it('gives every screenshot the same height, fits and centers the row', () => {
    const r = fitRow([16 / 9, 16 / 9], box, 40, NO_CHROME);
    const [a, b] = r.placements;
    expect(a.image.h).toBeCloseTo(b.image.h);
    expect(b.card.x - (a.card.x + a.card.w)).toBeCloseTo(40);
    r.placements.forEach((p) => expect(inside(p.card)).toBe(true));
    expect(r.bounds.x - box.x).toBeCloseTo(box.x + box.w - (r.bounds.x + r.bounds.w));
  });

  it('accounts for frame chrome', () => {
    const chrome = { left: 0, right: 0, top: 40, bottom: 0 };
    const r = fitRow([1], { x: 0, y: 0, w: 1000, h: 540 }, 0, chrome);
    expect(r.placements[0].card.h).toBeCloseTo(540);
    expect(r.placements[0].image.h).toBeCloseTo(500);
    expect(r.placements[0].image.y - r.placements[0].card.y).toBe(40);
  });
});

describe('fitColumn', () => {
  it('gives every screenshot the same width and stacks with the gap', () => {
    const r = fitColumn([3, 3], box, 40, NO_CHROME);
    const [a, b] = r.placements;
    expect(a.image.w).toBeCloseTo(b.image.w);
    expect(b.card.y - (a.card.y + a.card.h)).toBeCloseTo(40);
    r.placements.forEach((p) => expect(inside(p.card)).toBe(true));
  });
});

describe('fitGrid', () => {
  it('lays 4 screenshots out as 2 × 2', () => {
    const r = fitGrid([1, 1, 1, 1], box, 20, NO_CHROME, 2);
    const xs = new Set(r.placements.map((p) => Math.round(p.card.x)));
    const ys = new Set(r.placements.map((p) => Math.round(p.card.y)));
    expect(xs.size).toBe(2);
    expect(ys.size).toBe(2);
    r.placements.forEach((p) => expect(inside(p.card)).toBe(true));
  });

  it('lines up outer edges and centers mixed screenshots with no uneven gap', () => {
    const aspects = [1.69, 1.6, 2.08, 1.45];
    const r = fitGrid(aspects, box, 24, NO_CHROME, 2);
    const left = r.bounds.x - box.x, right = box.x + box.w - (r.bounds.x + r.bounds.w);
    const top = r.bounds.y - box.y, bottom = box.y + box.h - (r.bounds.y + r.bounds.h);
    expect(left).toBeCloseTo(right);
    expect(top).toBeCloseTo(bottom);
    expect(Math.min(left, top)).toBeCloseTo(0);
    const rightEdge = (i: number) => r.placements[i].card.x + r.placements[i].card.w;
    expect(r.placements[0].card.x).toBeCloseTo(r.placements[2].card.x);
    expect(rightEdge(1)).toBeCloseTo(rightEdge(3));
    r.placements.forEach((p) => expect(inside(p.card)).toBe(true));
  });

  it('shrinkwraps a mixed grid exactly when the canvas is Auto Fit with zero padding', () => {
    const aspects = [1.69, 1.6, 2.08, 1.45];
    const { w, h } = solveAutoCanvas(contentCoefficients(aspects, 24, NO_CHROME, 'grid', 2), 0, () => 0, 1920);
    const r = fitGrid(aspects, { x: 0, y: 0, w, h }, 24, NO_CHROME, 2);
    expect(r.bounds.x).toBeCloseTo(0, 0);
    expect(r.bounds.y).toBeCloseTo(0, 0);
    expect(r.bounds.w).toBeCloseTo(w, 0);
    expect(r.bounds.h).toBeCloseTo(h, 0);
  });

  it('centers a short last row', () => {
    const r = fitGrid([1, 1, 1], box, 20, NO_CHROME, 2);
    const last = r.placements[2].card;
    expect(last.x + last.w / 2).toBeCloseTo(box.x + box.w / 2);
  });
});

describe('fitAuto', () => {
  it('stacks very wide screenshots vertically', () => {
    expect(fitAuto([3, 3], box, 40, NO_CHROME).direction).toBe('column');
  });

  it('puts tall screenshots side by side', () => {
    expect(fitAuto([9 / 16, 9 / 16], box, 40, NO_CHROME).direction).toBe('row');
  });

  it('never produces smaller screenshots than row or column', () => {
    const aspects = [1.6, 0.7, 1.2];
    const auto = fitAuto(aspects, box, 40, NO_CHROME);
    expect(auto.imageArea).toBeGreaterThanOrEqual(fitRow(aspects, box, 40, NO_CHROME).imageArea * 0.97);
    expect(auto.imageArea).toBeGreaterThanOrEqual(fitColumn(aspects, box, 40, NO_CHROME).imageArea * 0.97);
  });
});

describe('solveAutoCanvas', () => {
  it('wraps a single screenshot with padding and a 1920 long edge', () => {
    const coeff = contentCoefficients([16 / 9], 0, NO_CHROME, 'auto', 2);
    const { w, h } = solveAutoCanvas(coeff, 100, () => 0, 1920);
    expect(w).toBeCloseTo(1920);
    expect((w - 200) / (h - 200)).toBeCloseTo(16 / 9, 2);
  });

  it('reserves room for text', () => {
    const coeff = contentCoefficients([9 / 16], 0, NO_CHROME, 'auto', 2);
    const { w, h } = solveAutoCanvas(coeff, 100, () => 150, 1920);
    expect(h).toBeCloseTo(1920);
    expect((w - 200) / (h - 200 - 150)).toBeCloseTo(9 / 16, 2);
  });
});
