import { Columns2, LayoutGrid, Rows2, Sparkles } from 'lucide-react';
import type { Direction } from '../../types/scene';
import { Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { Slider } from '../ui/Slider';
import { SliderCard } from '../ui/SliderCard';
import { useSceneStore } from '../../store/sceneStore';

const HINTS: Record<Direction, string> = {
  auto: 'Fixed ratios: the arrangement with the biggest screenshots. Auto Fit: the squarest canvas with balanced sizes, in your image order.',
  row: 'Side by side — best for tall screens like mobile UI.',
  column: 'Stacked — best for wide screens like desktop UI.',
  grid: 'Rows that line up edge to edge, for three or more screenshots.',
};

export function LayoutPanel() {
  const layout = useSceneStore((s) => s.scene.layout);
  const count = useSceneStore((s) => s.scene.images.length);
  const patch = useSceneStore((s) => s.patchLayout);
  const maxColumns = Math.max(2, Math.min(6, count));

  return (
    <div className="space-y-4">
      <Field label="Arrangement">
        <Segmented<Direction>
          value={layout.direction}
          onChange={(direction) => patch({ direction })}
          options={[
            { value: 'auto', label: <><Sparkles /> Auto</>, title: 'Auto' },
            { value: 'row', label: <><Columns2 /> Row</>, title: 'Side by side' },
            { value: 'column', label: <><Rows2 /> Stack</>, title: 'Stacked vertically' },
            { value: 'grid', label: <><LayoutGrid /> Grid</>, title: 'Grid' },
          ]}
        />
        <p className="mt-2 text-[12px] leading-relaxed text-smoke">{HINTS[layout.direction]}</p>
      </Field>

      {layout.direction === 'grid' && (
        <Slider label="Columns" min={1} max={maxColumns} value={Math.min(layout.columns, maxColumns)} onChange={(columns) => patch({ columns })} />
      )}

      <SliderCard label="Padding" min={0} max={400} value={layout.padding} presets={[0, 16, 32, 64, 96, 128]} onChange={(padding) => patch({ padding })} />
      <SliderCard label="Gap between images" min={0} max={240} value={layout.gap} presets={[0, 8, 16, 24, 48, 64]} onChange={(gap) => patch({ gap })} />
    </div>
  );
}
