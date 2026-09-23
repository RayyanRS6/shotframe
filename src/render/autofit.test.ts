import { describe, expect, it } from 'vitest';
import { chooseAutoFitPartition, fitPartition, partitionCoefficients, solveAutoCanvas } from './layout';
import { NO_CHROME } from '../presets/frames';

const choose = (aspects: number[], gap = 64, padding = 120, caption = 0) =>
  chooseAutoFitPartition(aspects, gap, NO_CHROME, padding, caption, 1920);

function canvasFor(aspects: number[], gap = 64, padding = 120) {
  const p = choose(aspects, gap, padding);
  return { p, ...solveAutoCanvas(partitionCoefficients(aspects, p, gap, NO_CHROME), padding, () => 0, 1920) };
}

describe('Auto Fit arrangement', () => {
  it('puts two squares side by side above a wide screenshot', () => {
    const { p, w, h } = canvasFor([1, 1, 16 / 9]);
    expect(p).toEqual({ axis: 'rows', groups: [[0, 1], [2]] });
    expect(w / h).toBeGreaterThan(0.8);
    expect(w / h).toBeLessThan(1.25);
  });

  it('makes four equal screenshots a 2 × 2 grid rather than a lopsided 3 + 1', () => {
    expect(choose([16 / 9, 16 / 9, 16 / 9, 16 / 9])).toEqual({ axis: 'rows', groups: [[0, 1], [2, 3]] });
  });

  it('stacks two wide screenshots and lines up tall ones side by side', () => {
    expect(choose([16 / 9, 16 / 9])).toEqual({ axis: 'rows', groups: [[0], [1]] });
    expect(choose([0.46, 0.46, 0.46])).toEqual({ axis: 'rows', groups: [[0, 1, 2]] });
  });

  it('keeps the screenshots in their original order', () => {
    const p = choose([1.2, 0.5, 2, 1, 0.7, 1.6]);
    expect(p.groups.flat()).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('shrinkwraps the chosen arrangement exactly with zero padding', () => {
    const aspects = [1, 1, 16 / 9];
    const { p, w, h } = canvasFor(aspects, 24, 0);
    const r = fitPartition(aspects, { x: 0, y: 0, w, h }, 24, NO_CHROME, p);
    expect(r.bounds.x).toBeCloseTo(0);
    expect(r.bounds.y).toBeCloseTo(0);
    expect(r.bounds.w).toBeCloseTo(w);
    expect(r.bounds.h).toBeCloseTo(h);
    // Justified rows: both rows end at the same right edge.
    const right = (i: number) => r.placements[i].card.x + r.placements[i].card.w;
    expect(right(1)).toBeCloseTo(right(2));
  });
});
