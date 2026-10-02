import { describe, expect, it } from 'vitest';
import type { TextCardItem } from '../types/scene';
import { DEFAULT_TEXT_CARD } from '../store/defaults';
import { layoutTextCard, textCardAspect } from './textCard';

/** Every character is 10px wide, whatever the font. */
const ctx = { font: '', letterSpacing: '0px', measureText: (t: string) => ({ width: t.length * 10 }) } as unknown as CanvasRenderingContext2D;

const card = (patch: Partial<TextCardItem> = {}): TextCardItem => ({ ...DEFAULT_TEXT_CARD, id: 't', ...patch });
const text = (content: string, size = 20) => ({ ...DEFAULT_TEXT_CARD.body, content, size, lineHeight: 1.5 });

describe('text card layout', () => {
  it('hugs its text when the shape is auto', () => {
    const c = card({ heading: { ...text('Hi', 40), enabled: false }, body: text('one two'), width: 400, padding: 50 });
    const l = layoutTextCard(ctx, c);
    expect(l.textHeight).toBe(30);
    expect(l.height).toBe(30 + 100);
    expect(textCardAspect(ctx, c)).toBeCloseTo(400 / 130);
  });

  it('wraps at the card width minus padding and stacks heading above body', () => {
    // 300px of room fits 30 characters per line.
    const l = layoutTextCard(ctx, card({ heading: text('Short heading'), body: text('a'.repeat(10) + ' ' + 'b'.repeat(25)), width: 400, padding: 50 }));
    expect(l.blocks).toHaveLength(2);
    expect(l.blocks[1].layout.lines).toEqual(['a'.repeat(10), 'b'.repeat(25)]);
    expect(l.blocks[1].y).toBeGreaterThan(l.blocks[0].layout.height);
  });

  it('keeps a fixed shape whatever the text', () => {
    expect(textCardAspect(ctx, card({ shape: '4:5' }))).toBeCloseTo(0.8);
    expect(textCardAspect(ctx, card({ shape: '16:9', body: text('word '.repeat(200)) }))).toBeCloseTo(16 / 9);
  });

  it('falls back to a 2:1 card when there is no text', () => {
    const empty = card({ heading: { ...text(''), enabled: false }, body: text('   ') });
    expect(textCardAspect(ctx, empty)).toBeCloseTo(2);
  });
});
