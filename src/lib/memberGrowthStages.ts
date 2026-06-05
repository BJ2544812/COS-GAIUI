/** Canonical growth stages stored on Member.growthStage */
export const GROWTH_STAGE_KEYS = [
  'Visitor',
  'NewBeliever',
  'Member',
  'Volunteer',
  'Leader',
  'CoreTeam',
  'Staff',
] as const;

export type GrowthStageKey = (typeof GROWTH_STAGE_KEYS)[number];

export const GROWTH_PIPELINE: { key: GrowthStageKey; label: string }[] = [
  { key: 'Visitor', label: 'Visitor' },
  { key: 'NewBeliever', label: 'New Believer' },
  { key: 'Member', label: 'Member' },
  { key: 'Volunteer', label: 'Volunteer' },
  { key: 'Leader', label: 'Leader' },
  { key: 'CoreTeam', label: 'Core Team' },
];

export function growthStageLabel(key: string | null | undefined): string {
  if (!key) return 'Visitor';
  const found = GROWTH_PIPELINE.find((s) => s.key === key);
  if (found) return found.label;
  if (key === 'Staff') return 'Core Team';
  return key.replace(/([A-Z])/g, ' $1').trim();
}

export function normalizeGrowthStageKey(key: string): GrowthStageKey {
  if (key === 'Staff') return 'CoreTeam';
  if ((GROWTH_STAGE_KEYS as readonly string[]).includes(key)) return key as GrowthStageKey;
  return 'Visitor';
}

export function pipelineIndex(stage: string | null | undefined): number {
  const normalized = stage === 'Staff' ? 'CoreTeam' : stage;
  const idx = GROWTH_PIPELINE.findIndex((s) => s.key === normalized);
  return idx >= 0 ? idx : 0;
}
