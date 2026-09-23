import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: Toast[];
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, tone: ToastTone = 'info') {
  const id = nextId++;
  useToasts.setState((s) => ({ toasts: [...s.toasts.slice(-2), { id, message, tone }] }));
  setTimeout(() => useToasts.getState().dismiss(id), tone === 'error' ? 4200 : 2600);
}
