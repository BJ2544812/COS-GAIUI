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
import type { AgendaSession } from '@/lib/liveOps';

function SortableRow({
  item,
  onChange,
}: {
  item: AgendaSession;
  onChange: (patch: Partial<AgendaSession>) => void;
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
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-100 bg-white"
    >
      <button
        type="button"
        className="p-2 min-h-[44px] min-w-[44px] text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-manipulation"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder session"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <Input
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        className="flex-1 min-w-[120px] h-11 font-bold"
        placeholder="Session name"
      />
      <Input
        value={item.startTime ?? ''}
        onChange={(e) => onChange({ startTime: e.target.value })}
        className="w-24 h-11 font-mono text-sm"
        placeholder="Time"
      />
      <Input
        value={item.duration ?? ''}
        onChange={(e) => onChange({ duration: e.target.value })}
        className="w-20 h-11 font-mono text-sm"
        placeholder="Dur"
      />
    </li>
  );
}

export function SortableAgendaSessions({
  rows,
  onChange,
}: {
  rows: AgendaSession[];
  onChange: (rows: AgendaSession[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((r) => r.id === active.id);
    const newIndex = rows.findIndex((r) => r.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(rows, oldIndex, newIndex).map((r, i) => ({ ...r, sortOrder: i }));
    onChange(next);
  };

  const patchRow = (id: string, patch: Partial<AgendaSession>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {rows.map((row) => (
            <SortableRow key={row.id} item={row} onChange={(p) => patchRow(row.id, p)} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
