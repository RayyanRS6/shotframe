import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
  style?: CSSProperties;
}

type Tone = 'dark' | 'light';

const BUTTON: Record<Tone, { base: string; open: string; chevron: string }> = {
  dark: {
    base: 'h-10 w-full rounded-xl border border-edge bg-graphite pr-9 pl-3 text-white hover:bg-slate',
    open: 'border-lime/70 ring-4 ring-lime/15',
    chevron: 'text-smoke',
  },
  light: {
    base: 'h-10 rounded-full border border-rule bg-card pr-9 pl-4 text-ink shadow-card hover:bg-[#f7f7f3]',
    open: 'ring-4 ring-lime/40',
    chevron: 'text-stone',
  },
};

const MENU: Record<Tone, string> = {
  dark: 'rounded-2xl border border-edge bg-graphite text-white shadow-float [color-scheme:dark]',
  light: 'rounded-2xl border border-rule bg-card text-ink shadow-[0_16px_48px_rgb(21_21_21/0.14)]',
};

function optionClass(tone: Tone, selected: boolean, active: boolean): string {
  if (tone === 'dark') return `${active ? 'bg-slate' : ''} ${selected ? 'font-semibold text-lime' : active ? 'text-white' : 'text-white/80'}`;
  return selected ? 'bg-lime font-semibold text-ink' : active ? 'bg-paper text-ink' : 'text-ink/80';
}

/** Themed dropdown (listbox) — replaces the native select so the popup matches the app. */
export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  tone = 'dark',
  className = '',
  style,
  renderValue,
  menuMinWidth = 0,
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  tone?: Tone;
  className?: string;
  style?: CSSProperties;
  renderValue?: (option: SelectOption<T> | undefined) => ReactNode;
  menuMinWidth?: number;
}) {
  const [menu, setMenu] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  /** Menu position next to the button, or null once the button has scrolled out of view. */
  const computeMenu = () => {
    const button = buttonRef.current;
    if (!button) return null;
    const r = button.getBoundingClientRect();
    const scroller = button.closest('.sf-scroll')?.getBoundingClientRect();
    const outOfView = r.bottom < 0 || r.top > window.innerHeight || (scroller && (r.bottom < scroller.top || r.top > scroller.bottom));
    if (outOfView) return null;
    // Full height of every option (36px rows, 2px gaps, padding and border): the menu opens in full
    // and only scrolls when the window itself is too short to fit it.
    const wanted = options.length * 38 - 2 + 14;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const down = below >= wanted || below >= above;
    const maxHeight = Math.max(120, Math.min(wanted, down ? below : above));
    const width = Math.max(r.width, menuMinWidth);
    const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    const top = down ? r.bottom + 6 : r.top - 6 - Math.min(wanted, maxHeight);
    return { left, top, width, maxHeight };
  };

  const openMenu = () => {
    setActive(selectedIndex);
    setMenu(computeMenu());
  };

  const close = (refocus: boolean) => {
    setMenu(null);
    if (refocus) buttonRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close(true);
  };

  const open = menu !== null;

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    // Follow the button while the page or sidebar scrolls (including late or momentum scroll
    // events) instead of closing, so the menu never vanishes right after it opens.
    let frame = 0;
    const follow = (e: Event) => {
      if (e.target instanceof Node && listRef.current?.contains(e.target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMenu((m) => (m ? computeMenu() : m)));
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (listRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setMenu(null);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', follow, true);
    window.addEventListener('resize', follow);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', follow, true);
      window.removeEventListener('resize', follow);
    };
    // computeMenu reads refs and props at call time; re-subscribing on every reposition isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (menu) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, menu]);

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(options.length - 1, a + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        close(true);
        break;
      case 'Tab':
        close(false);
        break;
    }
  };

  const b = BUTTON[tone];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={!!menu}
        aria-controls={menu ? `${id}-list` : undefined}
        onClick={() => (menu ? close(false) : openMenu())}
        onKeyDown={onButtonKey}
        style={style}
        className={`relative flex items-center text-left text-[13px] transition-colors focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none ${b.base} ${menu ? b.open : ''} ${className}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">{renderValue ? renderValue(selected) : selected?.label}</span>
        <ChevronDown className={`pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 transition-transform ${b.chevron} ${menu ? 'rotate-180' : ''}`} />
      </button>

      {menu &&
        createPortal(
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onListKey}
            className={`sf-pop ${tone === 'dark' ? 'sf-scroll' : 'sf-scroll-light'} fixed z-[60] space-y-0.5 overflow-y-auto p-1.5 outline-none ${MENU[tone]}`}
            style={{ left: menu.left, top: menu.top, width: menu.width, maxHeight: menu.maxHeight }}
          >
            {options.map((o, i) => {
              const isSelected = i === selectedIndex;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  style={o.style}
                  className={`flex h-9 cursor-pointer items-center gap-2 rounded-xl px-3 text-[13px] transition-colors ${optionClass(tone, isSelected, i === active)}`}
                >
                  <span className="truncate">{o.label}</span>
                  {o.hint && (
                    <span className={`ml-auto shrink-0 text-[12px] font-normal ${tone === 'dark' ? 'text-smoke' : isSelected ? 'text-ink/60' : 'text-stone'}`}>{o.hint}</span>
                  )}
                  {isSelected && <Check className={`size-3.5 shrink-0 ${o.hint ? '' : 'ml-auto'} ${tone === 'dark' ? 'text-lime' : 'text-ink'}`} strokeWidth={3} />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </>
  );
}
