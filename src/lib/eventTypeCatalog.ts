/** Church-facing event types mapped to canonical storage values (Service | Special | SmallGroup). */
export type EventTypeCanonical = 'Service' | 'Special' | 'SmallGroup';

export type EventCreateTypeOption = {
  id: string;
  label: string;
  canonicalType: EventTypeCanonical;
  /** Stored in opsConfig.eventCategory for list badges and filters */
  category?: string;
};

export const EVENT_CREATE_TYPE_OPTIONS: EventCreateTypeOption[] = [
  { id: 'worship-service', label: 'Worship Service', canonicalType: 'Service' },
  { id: 'prayer-meeting', label: 'Prayer Meeting', canonicalType: 'SmallGroup', category: 'Prayer' },
  { id: 'youth-event', label: 'Youth Event', canonicalType: 'SmallGroup', category: 'Youth' },
  { id: 'conference', label: 'Conference', canonicalType: 'Special', category: 'Conference' },
  { id: 'training', label: 'Training', canonicalType: 'Special', category: 'Training' },
  { id: 'outreach', label: 'Outreach', canonicalType: 'Special', category: 'Outreach' },
  { id: 'special-event', label: 'Special Event', canonicalType: 'Special' },
  { id: 'small-group', label: 'Small Group', canonicalType: 'SmallGroup' },
];

const byId = new Map(EVENT_CREATE_TYPE_OPTIONS.map((o) => [o.id, o]));

export function resolveEventCreateOption(optionId: string): EventCreateTypeOption {
  return byId.get(optionId) ?? EVENT_CREATE_TYPE_OPTIONS.find((o) => o.id === 'special-event')!;
}

export function defaultCreateTypeOptionId(): string {
  return 'special-event';
}

/** Display label for list cards and workspace headers */
export function labelForEventType(type: string, category?: string | null): string {
  if (category?.trim()) return category.trim();
  const match = EVENT_CREATE_TYPE_OPTIONS.find((o) => o.canonicalType === type && !o.category);
  if (match) return match.label;
  if (type === 'Service') return 'Worship Service';
  if (type === 'SmallGroup') return 'Small Group';
  if (type === 'Special') return 'Special Event';
  return type;
}

export function readEventCategory(opsConfig: unknown): string | undefined {
  if (!opsConfig || typeof opsConfig !== 'object') return undefined;
  const cat = (opsConfig as { eventCategory?: unknown }).eventCategory;
  return typeof cat === 'string' && cat.trim() ? cat.trim() : undefined;
}

/** Default local datetime for new events — worship services at 9:00 AM local */
export function defaultEventDateIso(type: EventTypeCanonical, dateYmd: string): string {
  const hour = type === 'Service' ? 9 : 10;
  const minute = type === 'Service' ? 0 : 30;
  const local = new Date(`${dateYmd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  return local.toISOString();
}

/** Next Sunday (or today if Sunday) as YYYY-MM-DD for worship service defaults */
export function defaultWorshipServiceDateYmd(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10);
}
