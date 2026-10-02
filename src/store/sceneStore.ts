import { create } from 'zustand';
import { temporal } from 'zundo';
import { isTextCard, type Background, type Caption, type ExportSettings, type ImageItem, type Layout, type RatioId, type Scene, type Style, type TextCardItem } from '../types/scene';
import { DEFAULT_SCENE, DEFAULT_TEXT_CARD } from './defaults';
import { isFlippable, ratioPreset } from '../presets/ratios';
import { newId } from '../utils/id';

export type TextRole = 'pill' | 'heading' | 'paragraph';

interface SceneState {
  scene: Scene;
  selectedId: string | null;
  hydrated: boolean;

  setRatio: (ratio: RatioId) => void;
  /** Turn the current ratio sideways (4:3 ↔ 3:4); 16:9 and 9:16 switch to each other. */
  flipRatio: () => void;
  patchBackground: (patch: Partial<Background>) => void;
  patchLayout: (patch: Partial<Layout>) => void;
  patchStyle: (patch: Partial<Style>) => void;
  patchCaption: (patch: Partial<Pick<Caption, 'position' | 'align'>>) => void;
  patchText: <R extends TextRole>(role: R, patch: Partial<Caption[R]>) => void;
  patchExport: (patch: Partial<ExportSettings>) => void;

  addImages: (items: ImageItem[]) => void;
  /** Appends a text card with fresh text, styled like the last one, and selects it. */
  addTextCard: () => void;
  patchTextCard: (id: string, patch: Partial<Omit<TextCardItem, 'id' | 'kind'>>) => void;
  /** Removes a screenshot or text card. */
  removeImage: (id: string) => void;
  replaceImage: (id: string, item: ImageItem) => void;
  moveImage: (from: number, to: number) => void;
  select: (id: string | null) => void;

  /** Replace the whole scene without recording undo history (hydration, new canvas). */
  loadScene: (scene: Scene) => void;
}

export const useSceneStore = create<SceneState>()(
  temporal(
    (set) => {
      const edit = (fn: (s: Scene) => Scene) => set((st) => ({ scene: fn(st.scene) }));
      return {
        scene: DEFAULT_SCENE,
        selectedId: null,
        hydrated: false,

        setRatio: (ratio) => edit((s) => (s.ratio === ratio ? s : { ...s, ratio, ratioFlipped: false })),
        flipRatio: () =>
          edit((s) => {
            const preset = ratioPreset(s.ratio);
            if (!isFlippable(preset)) return s;
            if (preset.inverse) return { ...s, ratio: preset.inverse, ratioFlipped: false };
            return { ...s, ratioFlipped: !s.ratioFlipped };
          }),
        patchBackground: (patch) => edit((s) => ({ ...s, background: { ...s.background, ...patch } })),
        patchLayout: (patch) => edit((s) => ({ ...s, layout: { ...s.layout, ...patch } })),
        patchStyle: (patch) => edit((s) => ({ ...s, style: { ...s.style, ...patch } })),
        patchCaption: (patch) => edit((s) => ({ ...s, caption: { ...s.caption, ...patch } })),
        patchText: (role, patch) =>
          edit((s) => ({ ...s, caption: { ...s.caption, [role]: { ...s.caption[role], ...patch } } })),
        patchExport: (patch) => edit((s) => ({ ...s, export: { ...s.export, ...patch } })),

        addImages: (items) => {
          if (!items.length) return;
          set((st) => ({ scene: { ...st.scene, images: [...st.scene.images, ...items] }, selectedId: items[items.length - 1].id }));
        },
        addTextCard: () =>
          set((st) => {
            const last = st.scene.images.filter(isTextCard).pop() ?? DEFAULT_TEXT_CARD;
            const card: TextCardItem = {
              ...last,
              id: newId(),
              heading: { ...last.heading, content: DEFAULT_TEXT_CARD.heading.content },
              body: { ...last.body, content: DEFAULT_TEXT_CARD.body.content },
            };
            return { scene: { ...st.scene, images: [...st.scene.images, card] }, selectedId: card.id };
          }),
        patchTextCard: (id, patch) =>
          edit((s) => ({ ...s, images: s.images.map((i) => (i.id === id && isTextCard(i) ? { ...i, ...patch } : i)) })),
        removeImage: (id) =>
          set((st) => ({
            scene: { ...st.scene, images: st.scene.images.filter((i) => i.id !== id) },
            selectedId: st.selectedId === id ? null : st.selectedId,
          })),
        replaceImage: (id, item) =>
          set((st) => ({
            scene: { ...st.scene, images: st.scene.images.map((i) => (i.id === id ? item : i)) },
            selectedId: st.selectedId === id ? item.id : st.selectedId,
          })),
        moveImage: (from, to) =>
          edit((s) => {
            if (to < 0 || to >= s.images.length) return s;
            const images = [...s.images];
            const [moved] = images.splice(from, 1);
            if (!moved) return s;
            images.splice(to, 0, moved);
            return { ...s, images };
          }),
        select: (selectedId) => set({ selectedId }),

        loadScene: (scene) => {
          const history = useSceneStore.temporal.getState();
          history.pause();
          set({ scene, selectedId: null, hydrated: true });
          history.resume();
          history.clear();
        },
      };
    },
    {
      partialize: (st) => ({ scene: st.scene }),
      equality: (a, b) => a.scene === b.scene,
      limit: 100,
      // Collapse rapid changes (slider drags, typing) into a single undo step.
      handleSet: (handleSet) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        let open = false;
        return (...args) => {
          if (!open) (handleSet as unknown as (...a: typeof args) => void)(...args);
          open = true;
          clearTimeout(timer);
          timer = setTimeout(() => (open = false), 350);
        };
      },
    },
  ),
);

export const undo = () => useSceneStore.temporal.getState().undo();
export const redo = () => useSceneStore.temporal.getState().redo();
