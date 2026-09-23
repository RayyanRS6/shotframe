import { useEffect } from 'react';
import { redo, undo, useSceneStore } from '../store/sceneStore';

const NON_TEXT_INPUTS = new Set(['range', 'checkbox', 'radio', 'button', 'color']);

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.closest('textarea, select')) return true;
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type);
}

export function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if (key === 'delete' || key === 'backspace') {
        const { selectedId, removeImage } = useSceneStore.getState();
        if (selectedId) {
          e.preventDefault();
          removeImage(selectedId);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
