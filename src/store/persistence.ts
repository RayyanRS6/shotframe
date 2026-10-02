import { del, get, keys, set } from 'idb-keyval';
import { isTextCard, type ImageItem, type Scene } from '../types/scene';
import { DEFAULT_SCENE, mergeScene } from './defaults';
import { useSceneStore } from './sceneStore';
import { useAssets } from './assets';
import { toast } from './toast';
import { newId } from '../utils/id';

// IndexedDB is built into the browser: nothing leaves the device and no account is needed.
const SCENE_KEY = 'scene:v1';
const IMG_PREFIX = 'img:';
const imgKey = (id: string) => `${IMG_PREFIX}${id}`;

function referencedIds(scene: Scene): string[] {
  const ids = scene.images.filter((i) => !isTextCard(i)).map((i) => i.id);
  if (scene.background.image.id) ids.push(scene.background.image.id);
  return ids;
}

let autosaveStarted = false;

function startAutosave() {
  if (autosaveStarted) return;
  autosaveStarted = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  useSceneStore.subscribe((state, prev) => {
    if (state.scene === prev.scene || !state.hydrated) return;
    clearTimeout(timer);
    timer = setTimeout(() => set(SCENE_KEY, state.scene).catch(() => toast('Could not save to browser storage', 'error')), 300);
  });
}

let hydration: Promise<void> | null = null;

/** Restore the last canvas from IndexedDB, then keep saving changes. Safe to call more than once. */
export function hydrate(): Promise<void> {
  hydration ??= restore();
  return hydration;
}

async function restore(): Promise<void> {
  let scene: Scene = DEFAULT_SCENE;
  try {
    const saved = await get(SCENE_KEY);
    if (saved) scene = mergeScene(saved);
    const ids = referencedIds(scene);
    await Promise.all(
      ids.map(async (id) => {
        const blob = await get<Blob>(imgKey(id));
        if (!blob) return;
        try {
          useAssets.getState().put(id, await createImageBitmap(blob), blob);
        } catch {
          /* unreadable blob: dropped below */
        }
      }),
    );
    const { bitmaps } = useAssets.getState();
    scene = { ...scene, images: scene.images.filter((i) => isTextCard(i) || bitmaps.has(i.id)) };
    if (scene.background.image.id && !bitmaps.has(scene.background.image.id)) {
      scene = { ...scene, background: { ...scene.background, kind: scene.background.kind === 'image' ? 'gradient' : scene.background.kind, image: { ...scene.background.image, id: null } } };
    }

    // Remove blobs that nothing references any more.
    const keep = new Set(referencedIds(scene).map(imgKey));
    const stored = await keys();
    await Promise.all(stored.filter((k) => typeof k === 'string' && k.startsWith(IMG_PREFIX) && !keep.has(k)).map((k) => del(k)));
  } catch (err) {
    console.warn('Shotframe: could not restore saved canvas', err);
  }
  useSceneStore.getState().loadScene(scene);
  startAutosave();
}

async function importBlob(blob: Blob, name: string): Promise<ImageItem | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }
  const id = newId();
  try {
    await set(imgKey(id), blob);
  } catch {
    toast('Browser storage is full — this image will not survive a refresh', 'error');
  }
  useAssets.getState().put(id, bitmap, blob);
  return { kind: 'image', id, name, width: bitmap.width, height: bitmap.height };
}

function imageFiles(files: Iterable<File | Blob>): (File | Blob)[] {
  return Array.from(files).filter((f) => f.type.startsWith('image/'));
}

function displayName(f: File | Blob, i: number) {
  return f instanceof File && f.name ? f.name : `Pasted image ${i + 1}`;
}

export async function addFiles(files: Iterable<File | Blob>): Promise<void> {
  const list = imageFiles(files);
  if (!list.length) {
    toast('Those files are not images', 'error');
    return;
  }
  const items = await Promise.all(list.map((f, i) => importBlob(f, displayName(f, i))));
  const ok = items.filter((i): i is ImageItem => i !== null);
  if (ok.length < list.length) toast(`${list.length - ok.length} file(s) could not be read — use PNG, JPG or WebP`, 'error');
  useSceneStore.getState().addImages(ok);
}

export async function replaceImageFile(id: string, file: File): Promise<void> {
  const item = await importBlob(file, file.name);
  if (!item) return toast('That file could not be read', 'error');
  useSceneStore.getState().replaceImage(id, item);
}

export async function setBackgroundImageFile(file: File): Promise<void> {
  const item = await importBlob(file, file.name);
  if (!item) return toast('That file could not be read', 'error');
  const { patchBackground, scene } = useSceneStore.getState();
  patchBackground({ kind: 'image', image: { ...scene.background.image, id: item.id } });
}

/** Start over: default settings, no images, storage cleared. */
export async function newCanvas(): Promise<void> {
  useSceneStore.getState().loadScene({ ...DEFAULT_SCENE, export: useSceneStore.getState().scene.export });
  useAssets.getState().clear();
  try {
    const stored = await keys();
    await Promise.all(stored.filter((k) => typeof k === 'string' && k.startsWith(IMG_PREFIX)).map((k) => del(k)));
    await set(SCENE_KEY, useSceneStore.getState().scene);
  } catch {
    /* storage unavailable; the in-memory canvas is already reset */
  }
}
