# Shotframe

Turn UI screenshots into polished, shareable images — on a gradient or your own background,
with rounded corners, shadows, window frames, 3D tilt and captions — then export in HD, 2K or 4K.

Everything runs in your browser. Images are kept in the browser's built-in storage (IndexedDB),
so your canvas survives a refresh. Nothing is uploaded, and there are no accounts or services.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # type-check + production build into dist/
npm test           # unit tests (layout math, export sizes)
```

`dist/` is a static site — open it from any static host.

## Features

- **Images** — browse, drag-drop anywhere, or paste (Ctrl+V). Reorder by dragging in the list or
  with the ← → buttons that appear on each image in the canvas; replace or remove.
- **Text cards** — a heading and paragraph in their own card, laid out, reordered, framed and tilted
  like a screenshot. The shape fits the text or is fixed (1:1, 4:3, 4:5, 16:9, 9:16; long text
  shrinks to fit), with card color, width, padding, alignment and the full font controls.
- **Canvas ratio** — Auto Fit (shrinkwraps to images & text), 16:9, 1:1, 4:3, 2:1, 3:2, 4:5,
  9:16 and 3:1, each labelled with what it's for. Click the selected ratio again to flip it
  (4:3 → 3:4; 16:9 and 9:16 switch to each other).
- **Background** — 54 gradient presets in five categories (Light & Airy, Dark Glow, Vivid & Bold,
  Chrome & Glass, Classic Linear), custom linear/radial/mesh gradients, solid colors, or your own
  image with blur and dim — plus adjustable film grain.
- **Layout** — Auto, row, stack, or an edge-aligned grid; padding and gap in 2px steps with presets.
- **Style** — rounded corners (2px steps, presets 0–48px), border stroke with color, drop shadows,
  11 frames (Clean Borderless, macOS Dark/Light, Browser Pill, Full Browser, Acrylic Glass, Mobile
  Mockup, Windows, Tablet, Polaroid, Stacked Cards) and 3D tilt.
- **Text** — pill, heading and paragraph above or below the screenshots, in 15 fonts (14 bundled,
  plus Anthropic Serif loaded from the `anthropic-fonts` package on jsDelivr),
  with weight, size, color, letter spacing, line height and alignment.
- **Export** — HD (1920), 2K (2560) or 4K UHD (3840) on the long edge · PNG, JPG or WebP ·
  copy to clipboard.
- **Undo / redo** — Ctrl+Z / Ctrl+Shift+Z. Delete removes the selected image or text card.

## How it works

One Canvas renderer (`src/render/renderScene.ts`) draws both the live preview and the export, so the
exported file matches the preview exactly at any resolution. All sizes are stored in "reference
pixels" for a 1920-px long edge and scaled at render time.

```
src/
  render/      layout math, background, cards & frames, shadows, WebGL tilt, text, composition
  export/      export sizes, PNG/JPG/WebP encoding, download, clipboard
  store/       scene state (zustand + undo), IndexedDB persistence, assets, toasts
  presets/     gradients, ratios, fonts, frames, shadows
  components/  top bar, canvas preview, inspector panels, UI primitives
```
