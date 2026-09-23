import type { Rect, Tilt } from '../types/scene';

export function isTilted(t: Tilt): boolean {
  return Math.abs(t.rotateX) > 0.01 || Math.abs(t.rotateY) > 0.01 || Math.abs(t.rotateZ) > 0.01;
}

interface Projected {
  x: number;
  y: number;
  /** Homogeneous depth factor, used for perspective-correct texturing. */
  w: number;
}

const RAD = Math.PI / 180;

/** Rotates a card-local point (origin at card center) in 3D and projects it, without fitting. */
function rawProjector(card: Rect, tilt: Tilt): (lx: number, ly: number) => Projected {
  const [sx, cx] = [Math.sin(tilt.rotateX * RAD), Math.cos(tilt.rotateX * RAD)];
  const [sy, cy] = [Math.sin(tilt.rotateY * RAD), Math.cos(tilt.rotateY * RAD)];
  const [sz, cz] = [Math.sin(tilt.rotateZ * RAD), Math.cos(tilt.rotateZ * RAD)];
  const d = Math.max(tilt.perspective, (Math.hypot(card.w, card.h) / 2) * 1.2);

  return (lx, ly) => {
    let x = lx * cz - ly * sz;
    let y = lx * sz + ly * cz;
    let z = 0;
    const x2 = x * cy + z * sy;
    z = -x * sy + z * cy;
    x = x2;
    const y3 = y * cx - z * sx;
    z = y * sx + z * cx;
    y = y3;
    const w = (d - z) / d;
    return { x: x / w, y: y / w, w };
  };
}

function cornerBounds(card: Rect, raw: (lx: number, ly: number) => Projected) {
  const hw = card.w / 2, hh = card.h / 2;
  const corners = [raw(-hw, -hh), raw(hw, -hh), raw(hw, hh), raw(-hw, hh)];
  const xs = corners.map((p) => p.x), ys = corners.map((p) => p.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/** Size of a card's projection before fitting; the layout reserves slots of this shape. */
export function projectedBounds(card: Rect, tilt: Tilt): { w: number; h: number } {
  const b = cornerBounds(card, rawProjector(card, tilt));
  return { w: b.w, h: b.h };
}

/**
 * Maps a card-local point to reference coords after rotating in 3D and projecting.
 * The projection is centered in `slot` and shrunk if needed so it stays inside it.
 */
export function makeProjector(card: Rect, tilt: Tilt, slot: Rect = card): (lx: number, ly: number) => Projected {
  const raw = rawProjector(card, tilt);
  const b = cornerBounds(card, raw);
  const k = Math.min(1, slot.w / b.w, slot.h / b.h);
  const bcx = b.minX + b.w / 2, bcy = b.minY + b.h / 2;
  const ox = slot.x + slot.w / 2, oy = slot.y + slot.h / 2;

  return (lx, ly) => {
    const p = raw(lx, ly);
    return { x: ox + (p.x - bcx) * k, y: oy + (p.y - bcy) * k, w: p.w };
  };
}

/** Rounded-rect outline projected into reference coords (for the tilted shadow). */
export function projectedOutline(
  card: Rect,
  body: Rect,
  radius: number,
  tilt: Tilt,
  slot: Rect = card,
): { x: number; y: number }[] {
  const project = makeProjector(card, tilt, slot);
  // The body (the visible card) may sit inside the card slot, e.g. below stacked layers.
  const bx = body.x + body.w / 2 - (card.x + card.w / 2);
  const by = body.y + body.h / 2 - (card.y + card.h / 2);
  const hw = body.w / 2, hh = body.h / 2;
  const r = Math.min(radius, hw, hh);
  const pts: { x: number; y: number }[] = [];
  const centers: [number, number, number][] = [
    [bx + hw - r, by - hh + r, -90],
    [bx + hw - r, by + hh - r, 0],
    [bx - hw + r, by + hh - r, 90],
    [bx - hw + r, by - hh + r, 180],
  ];
  const steps = r > 0 ? 8 : 0;
  for (const [ccx, ccy, start] of centers) {
    for (let i = 0; i <= steps; i++) {
      const a = (start + (90 * i) / Math.max(1, steps)) * RAD;
      pts.push(project(ccx + Math.cos(a) * r, ccy + Math.sin(a) * r));
    }
  }
  return pts;
}

interface GLState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  isWebGL2: boolean;
  buffer: WebGLBuffer;
  texture: WebGLTexture;
  aPos: number;
  aUv: number;
}

let state: GLState | null | undefined;

const VERT = `
attribute vec4 a_pos;
attribute vec2 a_uv;
varying vec2 v_uv;
void main() { gl_Position = a_pos; v_uv = a_uv; }`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
void main() { gl_FragColor = texture2D(u_tex, v_uv); }`;

function createGL(): GLState | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  const opts: WebGLContextAttributes = { premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true, alpha: true };
  const gl2 = canvas.getContext('webgl2', opts);
  const gl = gl2 ?? canvas.getContext('webgl', opts);
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer()!;
  const texture = gl.createTexture()!;
  return {
    canvas,
    gl,
    isWebGL2: !!gl2,
    buffer,
    texture,
    aPos: gl.getAttribLocation(program, 'a_pos'),
    aUv: gl.getAttribLocation(program, 'a_uv'),
  };
}

function getGL(): GLState | null {
  if (state && state.gl.isContextLost()) state = undefined;
  if (state === undefined) state = createGL();
  return state;
}

export function tiltSupported(): boolean {
  return getGL() !== null;
}

/**
 * Renders a card texture with 3D perspective. Returns a shared canvas plus where to draw it
 * (reference coords); draw it immediately, the canvas is reused by the next call.
 */
export function warpCard(
  source: HTMLCanvasElement,
  card: Rect,
  tilt: Tilt,
  scale: number,
  slot: Rect = card,
): { canvas: HTMLCanvasElement; x: number; y: number; w: number; h: number } | null {
  const s = getGL();
  if (!s) return null;
  const { gl } = s;
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  if (source.width > max || source.height > max) return null;

  const project = makeProjector(card, tilt, slot);
  const hw = card.w / 2, hh = card.h / 2;
  const corners = [project(-hw, -hh), project(hw, -hh), project(hw, hh), project(-hw, hh)];
  const margin = 2 / scale;
  const bx = Math.min(...corners.map((p) => p.x)) - margin;
  const by = Math.min(...corners.map((p) => p.y)) - margin;
  const bw = Math.max(...corners.map((p) => p.x)) + margin - bx;
  const bh = Math.max(...corners.map((p) => p.y)) + margin - by;
  const ow = Math.max(1, Math.ceil(bw * scale));
  const oh = Math.max(1, Math.ceil(bh * scale));
  if (ow > max || oh > max) return null;

  s.canvas.width = ow;
  s.canvas.height = oh;
  gl.viewport(0, 0, ow, oh);

  const uv = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const vert = (i: number) => {
    const p = corners[i];
    const nx = (((p.x - bx) * scale) / ow) * 2 - 1;
    const ny = 1 - (((p.y - by) * scale) / oh) * 2;
    return [nx * p.w, ny * p.w, 0, p.w, uv[i][0], uv[i][1]];
  };
  const data = new Float32Array([0, 1, 2, 0, 2, 3].flatMap(vert));

  gl.bindBuffer(gl.ARRAY_BUFFER, s.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(s.aPos);
  gl.vertexAttribPointer(s.aPos, 4, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(s.aUv);
  gl.vertexAttribPointer(s.aUv, 2, gl.FLOAT, false, 24, 16);

  gl.bindTexture(gl.TEXTURE_2D, s.texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (s.isWebGL2) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  return { canvas: s.canvas, x: bx, y: by, w: ow / scale, h: oh / scale };
}
