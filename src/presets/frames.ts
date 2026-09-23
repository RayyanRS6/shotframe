import type { FrameKind, Style } from '../types/scene';

/** Space added around the screenshot, in reference px. */
export interface Chrome {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const NO_CHROME: Chrome = { left: 0, right: 0, top: 0, bottom: 0 };

export const MAC_BAR = 40;
export const PILL_BAR = 52;
export const TAB_STRIP = 40;
export const TOOLBAR = 46;
export const WINDOWS_BAR = 40;
export const GLASS_PAD = 16;
export const MOBILE_BEZEL = 16;
export const TABLET_BEZEL = 24;
export const POLAROID_PAD = 20;
export const POLAROID_BOTTOM = 76;
export const STACK_TOP = 30;

const all = (n: number): Chrome => ({ left: n, right: n, top: n, bottom: n });
const top = (n: number): Chrome => ({ ...NO_CHROME, top: n });

/** Chrome between the border and the screenshot. */
export function frameInner(frame: FrameKind): Chrome {
  switch (frame) {
    case 'mac-dark':
    case 'mac-light':
      return top(MAC_BAR);
    case 'browser-pill':
      return top(PILL_BAR);
    case 'browser-full':
      return top(TAB_STRIP + TOOLBAR);
    case 'windows':
      return top(WINDOWS_BAR);
    case 'glass':
      return all(GLASS_PAD);
    case 'mobile':
      return all(MOBILE_BEZEL);
    case 'tablet':
      return all(TABLET_BEZEL);
    case 'polaroid':
      return { left: POLAROID_PAD, right: POLAROID_PAD, top: POLAROID_PAD, bottom: POLAROID_BOTTOM };
    default:
      return NO_CHROME;
  }
}

/** Chrome outside the card body (the peeking layers of a stack). */
export function frameOuter(frame: FrameKind): Chrome {
  return frame === 'stack' ? top(STACK_TOP) : NO_CHROME;
}

/** Everything around the screenshot: outer layers, border stroke, frame chrome. */
export function cardChrome(style: Pick<Style, 'frame' | 'border'>): Chrome {
  const inner = frameInner(style.frame);
  const outer = frameOuter(style.frame);
  const b = Math.max(0, style.border.width);
  return {
    left: outer.left + b + inner.left,
    right: outer.right + b + inner.right,
    top: outer.top + b + inner.top,
    bottom: outer.bottom + b + inner.bottom,
  };
}

export interface FrameOption {
  value: FrameKind;
  label: string;
  description: string;
  title?: boolean;
  url?: boolean;
  dark?: boolean;
}

export const FRAME_OPTIONS: FrameOption[] = [
  { value: 'none', label: 'Clean Borderless', description: 'Pure image without frame' },
  { value: 'mac-dark', label: 'macOS Dark', description: 'Dark header with traffic lights', title: true },
  { value: 'mac-light', label: 'macOS Light', description: 'Crisp light header with traffic lights', title: true },
  { value: 'browser-pill', label: 'Browser Pill', description: 'Minimal browser top bar with URL pill', url: true, dark: true },
  { value: 'browser-full', label: 'Full Browser', description: 'Header with back/forward & address bar', title: true, url: true, dark: true },
  { value: 'glass', label: 'Acrylic Glass', description: 'Translucent glassmorphism border' },
  { value: 'mobile', label: 'Mobile Mockup', description: 'Minimal phone pill cutout', dark: true },
  { value: 'windows', label: 'Windows', description: 'Title bar with minimize, maximize & close', title: true, dark: true },
  { value: 'tablet', label: 'Tablet', description: 'Even rounded bezel like an iPad', dark: true },
  { value: 'polaroid', label: 'Polaroid', description: 'Instant photo print with a caption', title: true },
  { value: 'stack', label: 'Stacked Cards', description: 'Layered cards peeking from behind', dark: true },
];

export function frameOption(frame: FrameKind): FrameOption {
  return FRAME_OPTIONS.find((f) => f.value === frame) ?? FRAME_OPTIONS[0];
}
