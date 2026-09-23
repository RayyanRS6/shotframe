import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { addFiles } from '../store/persistence';

/** Window-wide drag-drop and Ctrl+V paste for adding screenshots. */
export function DropOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');

    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth++;
      setActive(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      if (e.dataTransfer?.files.length) void addFiles(e.dataTransfer.files);
    };
    const paste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      void addFiles(files);
    };

    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
      window.removeEventListener('paste', paste);
    };
  }, []);

  if (!active) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-ink/35 p-6 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-lime-deep bg-card px-12 py-10 text-center shadow-float">
        <span className="grid size-14 place-items-center rounded-2xl bg-lime text-ink">
          <ImagePlus className="size-6" />
        </span>
        <p className="font-display text-[20px] font-bold">Drop screenshots to add them</p>
        <p className="text-[13px] text-stone">PNG, JPG or WebP</p>
      </div>
    </div>
  );
}
