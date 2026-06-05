/** Declaration document workflow stored in MemberDocument.notes (no schema change). */

export const DECLARATION_LIFECYCLE = [
  'Generated',
  'Downloaded',
  'UploadedSigned',
  'Verified',
] as const;

export type DeclarationLifecycle = (typeof DECLARATION_LIFECYCLE)[number];

const GENERATED_DOC_TYPES = new Set([
  'GeneratedVisitorDeclaration',
  'GeneratedMemberDeclaration',
  'GeneratedBaptismCertificate',
]);

export function isGeneratedDeclarationType(type: string): boolean {
  return GENERATED_DOC_TYPES.has(type) || type === 'DeclarationForm';
}

export function parseDeclarationLifecycle(notes: string | null | undefined): DeclarationLifecycle {
  if (!notes) return 'Generated';
  const match = notes.match(/lifecycle:(\w+)/i);
  const raw = match?.[1];
  if (raw && DECLARATION_LIFECYCLE.includes(raw as DeclarationLifecycle)) {
    return raw as DeclarationLifecycle;
  }
  return 'Generated';
}

export function withDeclarationLifecycle(
  notes: string | null | undefined,
  lifecycle: DeclarationLifecycle,
  extra?: string,
): string {
  const base = (notes || '').replace(/lifecycle:\w+/gi, '').trim();
  const parts = [`lifecycle:${lifecycle}`];
  if (extra?.trim()) parts.push(extra.trim());
  if (base) parts.push(base);
  return parts.join(' | ');
}

export function declarationLifecycleLabel(lifecycle: DeclarationLifecycle): string {
  switch (lifecycle) {
    case 'Generated':
      return 'Generated';
    case 'Downloaded':
      return 'Downloaded';
    case 'UploadedSigned':
      return 'Uploaded Signed Copy';
    case 'Verified':
      return 'Verified';
    default:
      return lifecycle;
  }
}
