import { useState } from 'react';
import { AlignCenterHorizontal, AlignEndHorizontal, AlignStartHorizontal, TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react';
import type { TextAlign, TextCardItem, TextCardShape, VerticalAlign } from '../../types/scene';
import { Card, Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { SliderCard } from '../ui/SliderCard';
import { OptionCard } from '../ui/OptionCard';
import { Toggle } from '../ui/Toggle';
import { BlockTabs, ColorRow, TextBlockEditor } from './TextBlockEditor';
import { frameInner } from '../../presets/frames';
import { useSceneStore } from '../../store/sceneStore';

type Tab = 'heading' | 'body' | 'card';

const SHAPES: { value: TextCardShape; label: string; description: string }[] = [
  { value: 'auto', label: 'Fit Text', description: 'Grows with your words' },
  { value: '1:1', label: 'Square', description: '1:1 · Quotes, big numbers' },
  { value: '4:3', label: 'Landscape', description: '4:3 · Beside desktop UI' },
  { value: '4:5', label: 'Portrait', description: '4:5 · Beside mobile UI' },
  { value: '16:9', label: 'Wide', description: '16:9 · Titles, banners' },
  { value: '9:16', label: 'Tall', description: '9:16 · Beside a full phone' },
];

const CARD_SWATCHES = ['#FFFFFF', '#F4EEE1', '#C9F0DA', '#FFE27A', '#D4F24A', '#7B5CE6', '#1A1A1E', '#0B0B0F'];

/** Text and card settings for the selected text card. */
export function TextCardEditor({ card }: { card: TextCardItem }) {
  const patch = useSceneStore((s) => s.patchTextCard);
  const frame = useSceneStore((s) => s.scene.style.frame);
  const [tab, setTab] = useState<Tab>('heading');
  const set = (p: Parameters<typeof patch>[1]) => patch(card.id, p);
  const inner = frameInner(frame);
  const hasFrame = inner.top + inner.right + inner.bottom + inner.left > 0;

  return (
    <div className="space-y-4">
      <BlockTabs
        ariaLabel="Text card settings"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'heading', label: 'Heading', on: card.heading.enabled },
          { id: 'body', label: 'Paragraph', on: card.body.enabled },
          { id: 'card', label: 'Card' },
        ]}
      />

      {tab === 'heading' && (
        <TextBlockEditor
          kind="heading"
          label="Heading"
          block={card.heading}
          onChange={(p) => set({ heading: { ...card.heading, ...p } })}
          sizePresets={[40, 48, 56, 64, 80]}
        />
      )}
      {tab === 'body' && (
        <TextBlockEditor
          kind="paragraph"
          label="Paragraph"
          block={card.body}
          onChange={(p) => set({ body: { ...card.body, ...p } })}
          sizePresets={[20, 24, 28, 32, 40]}
        />
      )}
      {tab === 'card' && (
        <div className="space-y-5">
          <Field label="Card shape">
            <div className="grid grid-cols-2 gap-2">
              {SHAPES.map((s) => (
                <OptionCard key={s.value} compact title={s.label} description={s.description} active={card.shape === s.value} onClick={() => set({ shape: s.value })} />
              ))}
            </div>
          </Field>

          <SliderCard label="Card width" min={320} max={1600} value={card.width} presets={[480, 640, 800, 1000, 1200]} onChange={(width) => set({ width })}>
            <p className="mt-3 text-[12px] leading-relaxed text-smoke">Text is sized for this width; the card scales with the layout like a screenshot.</p>
          </SliderCard>
          <SliderCard label="Inner padding" min={0} max={200} value={card.padding} presets={[24, 32, 48, 64, 96]} onChange={(padding) => set({ padding })} />

          <Card className="space-y-3">
            <ColorRow label="Card color" value={card.background} onChange={(background) => set({ background })} swatches={CARD_SWATCHES} />
            {hasFrame && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-white/70">Show window frame</span>
                <Toggle checked={card.frame} onChange={(frame) => set({ frame })} label="Show window frame" />
              </div>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Align">
              <Segmented<TextAlign>
                size="sm"
                value={card.align}
                onChange={(align) => set({ align })}
                options={[
                  { value: 'left', label: <TextAlignStart />, title: 'Align left' },
                  { value: 'center', label: <TextAlignCenter />, title: 'Align center' },
                  { value: 'right', label: <TextAlignEnd />, title: 'Align right' },
                ]}
              />
            </Field>
            <Field label="Vertical">
              <Segmented<VerticalAlign>
                size="sm"
                value={card.verticalAlign}
                onChange={(verticalAlign) => set({ verticalAlign })}
                options={[
                  { value: 'top', label: <AlignStartHorizontal />, title: 'Align top' },
                  { value: 'middle', label: <AlignCenterHorizontal />, title: 'Align middle' },
                  { value: 'bottom', label: <AlignEndHorizontal />, title: 'Align bottom' },
                ]}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
