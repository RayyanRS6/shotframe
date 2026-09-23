import { beforeEach, describe, expect, it } from 'vitest';
import { ratioView } from './ratios';
import { useSceneStore } from '../store/sceneStore';
import { DEFAULT_SCENE } from '../store/defaults';

describe('ratioView', () => {
  it('turns 4:3 into 3:4 when flipped', () => {
    const v = ratioView('4:3', true);
    expect(v.label).toBe('3:4');
    expect(v.title).toBe('3 : 4');
    expect(v.aspect).toBeCloseTo(3 / 4);
    expect(v.hint).toBe('Portrait');
  });

  it('leaves Auto Fit and 1:1 alone', () => {
    expect(ratioView('auto', true).aspect).toBeNull();
    expect(ratioView('1:1', true)).toMatchObject({ label: '1:1', aspect: 1 });
  });
});

describe('flipRatio', () => {
  beforeEach(() => useSceneStore.getState().loadScene(structuredClone(DEFAULT_SCENE)));
  const scene = () => useSceneStore.getState().scene;

  it('toggles the orientation of a ratio without a twin', () => {
    useSceneStore.getState().setRatio('4:3');
    useSceneStore.getState().flipRatio();
    expect(scene()).toMatchObject({ ratio: '4:3', ratioFlipped: true });
    useSceneStore.getState().flipRatio();
    expect(scene()).toMatchObject({ ratio: '4:3', ratioFlipped: false });
  });

  it('switches 16:9 and 9:16 to each other', () => {
    useSceneStore.getState().setRatio('16:9');
    useSceneStore.getState().flipRatio();
    expect(scene()).toMatchObject({ ratio: '9:16', ratioFlipped: false });
    useSceneStore.getState().flipRatio();
    expect(scene()).toMatchObject({ ratio: '16:9', ratioFlipped: false });
  });

  it('does nothing for Auto Fit or 1:1, and picking another ratio resets the flip', () => {
    useSceneStore.getState().setRatio('1:1');
    useSceneStore.getState().flipRatio();
    expect(scene()).toMatchObject({ ratio: '1:1', ratioFlipped: false });
    useSceneStore.getState().setRatio('3:2');
    useSceneStore.getState().flipRatio();
    useSceneStore.getState().setRatio('4:5');
    expect(scene()).toMatchObject({ ratio: '4:5', ratioFlipped: false });
  });
});
