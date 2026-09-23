import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'light' | 'dark' | 'ghost' | 'ghostDark';
type Size = 'sm' | 'md' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-lime text-ink hover:bg-[#c9e83c] shadow-[0_8px_24px_rgb(156_204_28/0.3)]',
  light: 'bg-card text-ink border border-rule hover:bg-[#f7f7f3]',
  dark: 'bg-slate text-white border border-edge hover:bg-[#303030]',
  ghost: 'text-stone hover:bg-black/[0.05] hover:text-ink',
  ghostDark: 'text-smoke hover:bg-slate hover:text-white',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-5 text-[13px] gap-2',
  icon: 'size-10',
};

export function Button({
  variant = 'light',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold transition-colors focus-visible:ring-4 focus-visible:ring-lime/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-4 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
