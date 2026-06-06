/**
 * Filters e2e / usability automation artifacts from leadership and ops surfaces.
 */
export function isOperationalTestArtifact(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  const n = name.trim();
  if (/^Usability\s/i.test(n)) return true;
  if (/^Frontend Validation\s/i.test(n)) return true;
  if (/\bUsability (Sunday|Conference)\s+\d{10,}/i.test(n)) return true;
  return false;
}

export function filterOperationalTestArtifacts<T extends { name: string }>(items: T[]): T[] {
  return items.filter((item) => !isOperationalTestArtifact(item.name));
}

export function filterOperationalTestTaskTitles<T extends { title: string }>(items: T[]): T[] {
  return items.filter((item) => !isOperationalTestArtifact(item.title));
}
