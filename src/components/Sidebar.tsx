import { useRef, useState, type ComponentType } from 'react';
import { Crop, Download, Frame, Layers, LayoutGrid, Palette, Type, type LucideIcon } from 'lucide-react';
import { Logo } from './Logo';
import { ImagesPanel } from './panels/ImagesPanel';
import { CanvasPanel } from './panels/CanvasPanel';
import { BackgroundPanel } from './panels/BackgroundPanel';
import { LayoutPanel } from './panels/LayoutPanel';
import { StylePanel } from './panels/StylePanel';
import { TextPanel } from './panels/TextPanel';
import { ExportPanel } from './panels/ExportPanel';
import { useSceneStore } from '../store/sceneStore';

type SectionId = 'images' | 'canvas' | 'background' | 'layout' | 'style' | 'text' | 'export';

const SECTIONS: { id: SectionId; label: string; title: string; description: string; icon: LucideIcon; Panel: ComponentType }[] = [
  { id: 'images', label: 'Images', title: 'Screenshots & text', description: 'Add screenshots or text cards, then reorder and edit them.', icon: Layers, Panel: ImagesPanel },
  { id: 'canvas', label: 'Canvas', title: 'Canvas ratio', description: 'Pick a size made for where you will post it.', icon: Crop, Panel: CanvasPanel },
  { id: 'background', label: 'Backdrop', title: 'Background', description: 'Gradients, solids or your own image — with grain.', icon: Palette, Panel: BackgroundPanel },
  { id: 'layout', label: 'Layout', title: 'Layout', description: 'Arrange your screenshots and set the spacing.', icon: LayoutGrid, Panel: LayoutPanel },
  { id: 'style', label: 'Style', title: 'Style & frame', description: 'Corners, borders, shadows, frames and 3D tilt.', icon: Frame, Panel: StylePanel },
  { id: 'text', label: 'Text', title: 'Text', description: 'Add a pill, a heading and a paragraph. For text in its own card, use Images.', icon: Type, Panel: TextPanel },
  { id: 'export', label: 'Export', title: 'Export', description: 'Download in HD, 2K or 4K — or copy it straight to your post.', icon: Download, Panel: ExportPanel },
];

const STORAGE_KEY = 'shotframe:section';

function initialSection(): SectionId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return SECTIONS.some((s) => s.id === saved) ? (saved as SectionId) : 'images';
  } catch {
    return 'images';
  }
}

/** Dark sidebar: section rail plus the controls for the chosen section. Rounded where it meets the light center. */
export function Sidebar() {
  const [active, setActive] = useState<SectionId>(initialSection);
  const count = useSceneStore((s) => s.scene.images.length);
  const scrollRef = useRef<HTMLDivElement>(null);
  const index = SECTIONS.findIndex((s) => s.id === active);
  const section = SECTIONS[index];
  const { Panel } = section;

  const choose = (id: SectionId) => {
    setActive(id);
    scrollRef.current?.scrollTo({ top: 0 });
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* storage unavailable; the choice just isn't remembered */
    }
  };

  return (
    <aside className="sf-grain order-2 flex h-[50dvh] shrink-0 flex-col overflow-hidden rounded-tl-[28px] rounded-tr-[28px] bg-coal text-white shadow-[0_-12px_40px_rgb(0_0_0/0.12)] [color-scheme:dark] min-[900px]:order-none min-[900px]:h-full min-[900px]:flex-row min-[900px]:rounded-tl-none min-[900px]:rounded-tr-[36px] min-[900px]:rounded-br-[36px] min-[900px]:shadow-[12px_0_40px_rgb(0_0_0/0.1)]">
      <nav
        aria-label="Sections"
        className="sf-scroll flex shrink-0 gap-1 overflow-x-auto border-b border-edge bg-night/80 p-2 min-[900px]:w-[88px] min-[900px]:flex-col min-[900px]:items-stretch min-[900px]:overflow-visible min-[900px]:border-r min-[900px]:border-b-0 min-[900px]:px-3 min-[900px]:py-5"
      >
        <div className="mb-5 hidden justify-center min-[900px]:flex">
          <Logo size={46} />
        </div>
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const on = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => choose(s.id)}
              aria-current={on ? 'page' : undefined}
              title={s.title}
              className={`relative flex min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold tracking-[0.04em] uppercase transition-colors focus-visible:ring-4 focus-visible:ring-lime/30 focus-visible:outline-none min-[900px]:py-2.5 ${
                on ? 'bg-lime text-ink' : 'text-smoke hover:bg-graphite hover:text-white'
              }`}
            >
              <Icon className="size-5" strokeWidth={on ? 2.25 : 1.75} />
              {s.label}
              {s.id === 'images' && count > 0 && (
                <span
                  className={`absolute top-1 right-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${
                    on ? 'bg-ink text-lime' : 'bg-violet text-white'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div ref={scrollRef} className="sf-scroll sf-scroll-rounded min-h-0 flex-1 overflow-y-auto min-[900px]:w-[360px]">
        <header className="px-5 pt-5 pb-4 min-[900px]:pt-7">
          <p className="text-[11px] font-bold tracking-[0.14em] text-lime uppercase">
            {String(index + 1).padStart(2, '0')} / {String(SECTIONS.length).padStart(2, '0')}
          </p>
          <h2 className="mt-1.5 font-display text-[28px] leading-none font-bold tracking-tight">{section.title}</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-smoke">{section.description}</p>
        </header>
        <div className="px-5 pb-8">
          <Panel />
        </div>
      </div>
    </aside>
  );
}
