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

function SortableRow({
  item,
  onChange,
}: {
  item: RunSheetSegment;
  onChange: (patch: Partial<RunSheetSegment>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

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
        <Input value={item.time} onChange={(e) => onChange({ time: e.target.value })} className="font-mono text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.duration} onChange={(e) => onChange({ duration: e.target.value })} className="font-mono text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.item} onChange={(e) => onChange({ item: e.target.value })} className="text-sm h-9 font-bold" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.media ?? ''} onChange={(e) => onChange({ media: e.target.value })} className="text-sm h-9" />
      </td>
      <td className="px-2 py-2">
        <Input value={item.owner ?? ''} onChange={(e) => onChange({ owner: e.target.value })} className="text-sm h-9" />
      </td>
    </tr>
  );
}

export function SortableRunSheet({
  rows,
  onChange,
}: {
  rows: RunSheetSegment[];
  onChange: (rows: RunSheetSegment[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 text-sm">
          <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {rows.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onChange={(patch) =>
                  onChange(rows.map((r) => (r.id === item.id ? { ...r, ...patch } : r)))
                }
              />
            ))}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
