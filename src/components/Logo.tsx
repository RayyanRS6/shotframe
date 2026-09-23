export function Logo({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Shotframe">
      <rect width="64" height="64" rx="18" fill="#D4F24A" />
      <rect x="13" y="17" width="38" height="30" rx="7" fill="#151515" />
      <circle cx="20" cy="23.5" r="2" fill="#D4F24A" />
      <circle cx="26" cy="23.5" r="2" fill="#B79CFF" />
      <circle cx="32" cy="23.5" r="2" fill="#93D5AE" />
      <rect x="19" y="30" width="26" height="11" rx="3" fill="#7B5CE6" />
    </svg>
  );
}
