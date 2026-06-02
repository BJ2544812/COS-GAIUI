import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { RunSheetSegment } from '@/lib/eventLifecycle';
import {
  getSermonIdFromSegment,
  isMessageSegment,
  setSermonIdOnSegment,
} from '@/lib/runSheetSermonRef';

type SermonOption = { id: string; title: string; speaker?: string | null };

function SortableRow({
  item,
  onChange,
  sermons,
}: {
  item: RunSheetSegment;
  onChange: (next: RunSheetSegment) => void;
  sermons?: SermonOption[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  const sermonId = getSermonIdFromSegment(item);
  const linked = sermons?.find((s) => s.id === sermonId);
  const showSermon = isMessageSegment(item) && sermons && sermons.length > 0;

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50 bg-white">
      <td className="px-2 py-2 w-10">
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="px-2 py-2">
        <Input value={item.time} onChange={(e) => onChange({ ...item, time: e.target.value })} className="font-mono text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.duration} onChange={(e) => onChange({ ...item, duration: e.target.value })} className="font-mono text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.item} onChange={(e) => onChange({ ...item, item: e.target.value })} className="text-sm h-9 font-bold" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.media ?? ''} onChange={(e) => onChange({ ...item, media: e.target.value })} className="text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.owner ?? ''} onChange={(e) => onChange({ ...item, owner: e.target.value })} className="text-sm h-9" />
      </td>
      {showSermon && (
        <td className="px-2 py-2 min-w-[180px]">
          <select
            className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm bg-white"
            value={sermonId ?? ''}
            onChange={(e) => onChange(setSermonIdOnSegment(item, e.target.value || null))}
          >
            <option value="">Link sermon…</option>
            {sermons!.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {s.speaker ? ` — ${s.speaker}` : ''}
              </option>
            ))}
          </select>
          {linked && (
            <p className="text-[10px] text-slate-500 mt-1 truncate">
              {linked.title}
              {linked.speaker ? ` · ${linked.speaker}` : ''}
            </p>
          )}
        </td>
      )}
      {!showSermon && sermons && sermons.length > 0 && <td className="px-2 py-2" />}
    </tr>
  );
}

export function SortableRunSheet({
  rows,
  onChange,
  sermons,
}: {
  rows: RunSheetSegment[];
  onChange: (rows: RunSheetSegment[]) => void;
  sermons?: SermonOption[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const hasSermonCol = Boolean(sermons && sermons.length > 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(rows, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <table className="w-full text-left font-sans">
        <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
          <tr>
            <th className="px-2 py-3 w-10" />
            <th className="px-2 py-3">Time</th>
            <th className="px-2 py-3">Dur</th>
            <th className="px-2 py-3">Segment</th>
            <th className="px-2 py-3">Media</th>
            <th className="px-2 py-3">Owner</th>
            {hasSermonCol && <th className="px-2 py-3">Sermon</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {rows.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                sermons={sermons}
                onChange={(next) => onChange(rows.map((r) => (r.id === item.id ? next : r)))}
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
