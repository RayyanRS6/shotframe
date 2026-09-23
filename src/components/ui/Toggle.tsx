export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-lime/25 focus-visible:outline-none ${checked ? 'bg-lime' : 'bg-[#333333]'}`}
    >
      <span className={`absolute top-1 left-1 size-4 rounded-full transition-transform ${checked ? 'translate-x-5 bg-ink' : 'bg-smoke'}`} />
    </button>
  );
}
