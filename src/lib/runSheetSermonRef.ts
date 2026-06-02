import type { RunSheetSegment } from '@/lib/eventLifecycle';

const SERMON_REF_PREFIX = 'sermon:';

/** Store sermon link in segment notes without schema changes. */
export function getSermonIdFromSegment(segment: RunSheetSegment): string | null {
  const notes = segment.notes?.trim() ?? '';
  if (notes.startsWith(SERMON_REF_PREFIX)) {
    const id = notes.slice(SERMON_REF_PREFIX.length).trim();
    return id.length > 0 ? id : null;
  }
  return null;
}

export function setSermonIdOnSegment(segment: RunSheetSegment, sermonId: string | null): RunSheetSegment {
  if (!sermonId) {
    const notes = segment.notes?.trim() ?? '';
    if (notes.startsWith(SERMON_REF_PREFIX)) {
      const { notes: _n, ...rest } = segment;
      return rest;
    }
    return segment;
  }
  return { ...segment, notes: `${SERMON_REF_PREFIX}${sermonId}` };
}

export function isMessageSegment(segment: RunSheetSegment): boolean {
  const type = (segment.segmentType ?? '').toLowerCase();
  const item = (segment.item ?? '').toLowerCase();
  return type === 'sermon' || type === 'message' || /\bmessage\b/.test(item);
}
