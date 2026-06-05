import { prisma } from './prisma.js';

const TYPE_BY_PREFIX = {
  VIS: ['GeneratedVisitorDeclaration'],
  MEM: ['GeneratedMemberDeclaration'],
  BAP: ['GeneratedBaptismCertificate'],
} as const;

export type ComplianceRefPrefix = keyof typeof TYPE_BY_PREFIX;

/** Sequential registry reference, e.g. VIS-2026-00081 */
export async function nextComplianceDocumentRef(
  tenantId: string,
  prefix: ComplianceRefPrefix,
  year = new Date().getFullYear(),
): Promise<string> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  const count = await prisma.memberDocument.count({
    where: {
      tenantId,
      type: { in: [...TYPE_BY_PREFIX[prefix]] },
      createdAt: { gte: start, lt: end },
    },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
}
