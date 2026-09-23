/** Output pixel size: the long edge is the tier's size, the short edge keeps the canvas aspect. */
export function exportDimensions(refW: number, refH: number, longEdge: number): { width: number; height: number } {
  if (refW >= refH) return { width: longEdge, height: Math.max(1, Math.round((longEdge * refH) / refW)) };
  return { width: Math.max(1, Math.round((longEdge * refW) / refH)), height: longEdge };
}
