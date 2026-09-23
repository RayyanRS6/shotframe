import { Check, CircleAlert, Info } from 'lucide-react';
import { useToasts } from '../store/toast';

const ICONS = { success: Check, error: CircleAlert, info: Info };

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border border-edge bg-ink py-2 pr-4 pl-2 text-[13px] font-medium text-white shadow-float"
          >
            <span
              className={`grid size-6 place-items-center rounded-full ${
                t.tone === 'error' ? 'bg-coral text-ink' : t.tone === 'success' ? 'bg-lime text-ink' : 'bg-violet text-white'
              }`}
            >
              <Icon className="size-3.5" strokeWidth={3} />
            </span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
