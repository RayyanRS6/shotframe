let ctx: CanvasRenderingContext2D | null = null;

/** Shared 2D context for text measurement outside of a real render. */
export function measureContext(): CanvasRenderingContext2D {
  if (!ctx) ctx = document.createElement('canvas').getContext('2d')!;
  return ctx;
}
