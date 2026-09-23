import { useRef } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, RefreshCw, Trash } from 'lucide-react';
import type { ImageItem } from '../../types/scene';
import { useSceneStore } from '../../store/sceneStore';
import { useAssets } from '../../store/assets';
import { addFiles, replaceImageFile } from '../../store/persistence';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

export function ImagesPanel() {
  const images = useSceneStore((s) => s.scene.images);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const removeImage = useSceneStore((s) => s.removeImage);
  const moveImage = useSceneStore((s) => s.moveImage);
  const thumbs = useAssets((s) => s.thumbs);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    moveImage(
      images.findIndex((i) => i.id === active.id),
      images.findIndex((i) => i.id === over.id),
    );
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-edge bg-graphite px-4 py-3.5 text-left transition-colors hover:border-lime/60"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-lime text-ink">
          <ImagePlus className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-white">Add screenshots</span>
          <span className="block text-[12px] text-smoke">Browse, drop anywhere, or paste with Ctrl+V</span>
        </span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) void addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {images.map((item) => (
                <ImageRow
                  key={item.id}
                  item={item}
                  thumb={thumbs[item.id]}
                  selected={item.id === selectedId}
                  onSelect={() => select(item.id)}
                  onRemove={() => removeImage(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {images.length > 1 && <p className="px-1 text-[12px] leading-relaxed text-smoke">Tip: hover an image on the canvas to move or remove it.</p>}
    </div>
  );
}

function ImageRow({
  item,
  thumb,
  selected,
  onSelect,
  onRemove,
}: {
  item: ImageItem;
  thumb?: string;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 rounded-[18px] border p-1.5 pr-1 transition-colors ${
        selected ? 'border-lime/60 bg-lime/[0.07]' : 'border-edge bg-graphite hover:bg-slate'
      } ${isDragging ? 'z-10 shadow-float' : ''}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${item.name}`}
        className="cursor-grab touch-none rounded-md p-0.5 text-smoke/70 hover:text-white active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <span className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate">
        {thumb && <img src={thumb} alt="" className="size-full object-cover object-top" draggable={false} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-white">{item.name}</span>
        <span className="block text-[11px] text-smoke tabular-nums">
          {item.width} × {item.height}
        </span>
      </span>
      <label
        title="Replace image"
        className="grid size-8 cursor-pointer place-items-center rounded-full text-smoke transition-colors hover:bg-slate hover:text-white"
      >
        <RefreshCw className="size-3.5" />
        <input
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void replaceImageFile(item.id, file);
            e.target.value = '';
          }}
        />
      </label>
      <button
        type="button"
        title="Remove image"
        aria-label={`Remove ${item.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="grid size-8 place-items-center rounded-full text-smoke transition-colors hover:bg-coral/15 hover:text-coral"
      >
        <Trash className="size-3.5" />
      </button>
    </li>
  );
}
