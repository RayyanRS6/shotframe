import { RotateCcw } from 'lucide-react';
import { OptionCard } from '../ui/OptionCard';
import { RATIOS, isFlippable, ratioView } from '../../presets/ratios';
import { useSceneStore } from '../../store/sceneStore';

function FlipBadge() {
  return (
    <span className="grid size-6 place-items-center rounded-full bg-lime text-ink">
      <RotateCcw className="size-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function CanvasPanel() {
  const ratio = useSceneStore((s) => s.scene.ratio);
  const flipped = useSceneStore((s) => s.scene.ratioFlipped);
  const setRatio = useSceneStore((s) => s.setRatio);
  const flipRatio = useSceneStore((s) => s.flipRatio);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {RATIOS.map((r) => {
          const active = r.id === ratio;
          const view = ratioView(r.id, active && flipped);
          const canFlip = isFlippable(r);
          const next = !canFlip ? null : r.inverse ? ratioView(r.inverse, false).title : ratioView(r.id, !(active && flipped)).title;
          return (
            <OptionCard
              key={r.id}
              title={view.title}
              description={view.description}
              active={active}
              onClick={() => (active ? flipRatio() : setRatio(r.id))}
              indicator={canFlip ? <FlipBadge /> : undefined}
              tooltip={active && next ? `Click again to flip to ${next}` : `${view.title} — ${view.description}`}
            />
          );
        })}
      </div>
      <p className="flex items-start gap-2 px-1 text-[12px] leading-relaxed text-smoke">
        <RotateCcw className="mt-0.5 size-3.5 shrink-0 text-lime" />
        Click the selected ratio again to flip it — 4 : 3 becomes 3 : 4.
      </p>
    </div>
  );
}
