import { describe, expect, it } from 'vitest';
import { DEFAULT_SCENE, mergeScene } from './defaults';

describe('mergeScene', () => {
  it('keeps a saved gradient intact instead of mixing in the default preset', () => {
    const saved = {
      background: { kind: 'gradient', gradient: { type: 'mesh', colors: ['#111111', '#222222'], angle: 0, presetId: 'old' } },
    };
    const scene = mergeScene(saved);
    expect(scene.background.gradient.colors).toEqual(['#111111', '#222222']);
    expect(scene.background.gradient.blobs).toBeUndefined();
    expect(scene.background.gradient.presetId).toBe('old');
  });

  it('fills in fields added after the save was made', () => {
    const scene = mergeScene({ ratio: '1:1', background: { kind: 'solid', solid: '#ffffff' } });
    expect(scene.ratio).toBe('1:1');
    expect(scene.background.solid).toBe('#ffffff');
    expect(scene.background.grain).toBe(DEFAULT_SCENE.background.grain);
    expect(scene.style.tilt.perspective).toBe(DEFAULT_SCENE.style.tilt.perspective);
  });

  it('keeps a saved background image id', () => {
    const scene = mergeScene({ background: { kind: 'image', image: { id: 'abc', blur: 4, dim: 0.2 } } });
    expect(scene.background.image).toEqual({ id: 'abc', blur: 4, dim: 0.2 });
  });

  it('migrates legacy browser frames and top/bottom text into the new model', () => {
    const scene = mergeScene({
      style: { frame: 'browser-dark' },
      texts: { top: { enabled: true, content: 'Hello', size: 80 }, bottom: { enabled: false, content: 'x' } },
    });
    expect(scene.style.frame).toBe('browser-pill');
    expect(scene.style.frameDark).toBe(true);
    expect(scene.caption.heading).toMatchObject({ enabled: true, content: 'Hello', size: 80 });
    expect(scene.caption.position).toBe('top');
    expect(scene.style.border).toEqual(DEFAULT_SCENE.style.border);
  });
});
