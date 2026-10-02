import { useState } from 'react';
import { TextAlignCenter, TextAlignEnd, TextAlignStart } from 'lucide-react';
import type { CaptionPosition, TextAlign } from '../../types/scene';
import { Field } from '../ui/Section';
import { Segmented } from '../ui/Segmented';
import { BlockTabs, TextBlockEditor } from './TextBlockEditor';
import { useSceneStore, type TextRole } from '../../store/sceneStore';

const ROLES: { id: TextRole; label: string }[] = [
  { id: 'pill', label: 'Pill' },
  { id: 'heading', label: 'Heading' },
  { id: 'paragraph', label: 'Paragraph' },
];

const SIZE_PRESETS: Record<TextRole, number[]> = {
  pill: [16, 20, 24, 28, 32],
  heading: [48, 56, 64, 72, 96],
  paragraph: [20, 24, 28, 32, 40],
};

function BlockEditor({ role }: { role: TextRole }) {
  const block = useSceneStore((s) => s.scene.caption[role]);
  const patchText = useSceneStore((s) => s.patchText);
  return (
    <TextBlockEditor
      kind={role}
      label={ROLES.find((r) => r.id === role)!.label}
      block={block}
      onChange={(p) => patchText(role, p)}
      sizePresets={SIZE_PRESETS[role]}
    />
  );
}

export function TextPanel() {
  const caption = useSceneStore((s) => s.scene.caption);
  const patchCaption = useSceneStore((s) => s.patchCaption);
  const [role, setRole] = useState<TextRole>('heading');

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Position">
          <Segmented<CaptionPosition>
            size="sm"
            value={caption.position}
            onChange={(position) => patchCaption({ position })}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
            ]}
          />
        </Field>
        <Field label="Align">
          <Segmented<TextAlign>
            size="sm"
            value={caption.align}
            onChange={(align) => patchCaption({ align })}
            options={[
              { value: 'left', label: <TextAlignStart />, title: 'Align left' },
              { value: 'center', label: <TextAlignCenter />, title: 'Align center' },
              { value: 'right', label: <TextAlignEnd />, title: 'Align right' },
            ]}
          />
        </Field>
      </div>

      <BlockTabs ariaLabel="Text elements" value={role} onChange={setRole} tabs={ROLES.map((r) => ({ ...r, on: caption[r.id].enabled }))} />

      <BlockEditor key={role} role={role} />
    </div>
  );
}
