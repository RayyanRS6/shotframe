import type { CSSProperties, ReactNode } from 'react';

/** Selectable card with a bold title and a short muted description. */
export function OptionCard({
  title,
  description,
  active,
  onClick,
  titleStyle,
  compact = false,
  indicator,
  tooltip,
}: {
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
  titleStyle?: CSSProperties;
  /** Tighter card for dense 2-column grids; the dot moves to the corner so titles keep their width. */
  compact?: boolean;
  /** Shown instead of the dot on the selected card, e.g. a flip badge. */
  indicator?: ReactNode;
  tooltip?: string;
}) {
  const showIndicator = active && indicator;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={tooltip ?? `${title} — ${description}`}
      className={`relative w-full min-w-0 rounded-[18px] border text-left transition-colors focus-visible:ring-4 focus-visible:ring-lime/25 focus-visible:outline-none ${
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
      } ${active ? 'border-lime/80 bg-lime/[0.08]' : 'border-edge bg-graphite hover:border-[#3d3d3d]'}`}
    >
      <span
        className={`block truncate font-semibold ${compact ? 'pr-2 text-[13px]' : showIndicator ? 'pr-8 text-[14px]' : 'pr-4 text-[14px]'} ${active ? 'text-lime' : 'text-white'}`}
        style={titleStyle}
      >
        {title}
      </span>
      <span className={`mt-0.5 block truncate text-smoke ${compact ? 'text-[11px]' : 'text-[12px]'}`}>{description}</span>
      {showIndicator ? (
        <span className="absolute top-3 right-3">{indicator}</span>
      ) : (
        active && (
          <span
            className={`absolute rounded-full bg-lime ${compact ? 'top-2.5 right-2.5 size-1.5' : 'top-1/2 right-3.5 size-2 -translate-y-1/2'}`}
          />
        )
      )}
    </button>
  );
}
