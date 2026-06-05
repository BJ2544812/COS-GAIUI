import { prisma } from './prisma.js';
import { logStructured } from './structuredLog.js';

const INCIDENTS_KEY = 'operational_incidents';
const MAX_INCIDENTS = 200;

export type OperationalIncident = {
  id: string;
  tenantId: string;
  severity: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  detail?: string;
  correlationId?: string;
  workflowId?: string;
  eventId?: string;
  status: 'open' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
};

async function readIncidents(tenantId: string): Promise<OperationalIncident[]> {
  const row = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId, key: INCIDENTS_KEY } },
  });
  if (!row?.value) return [];
  try {
    return JSON.parse(row.value) as OperationalIncident[];
  } catch {
    return [];
  }
}

async function writeIncidents(tenantId: string, incidents: OperationalIncident[]) {
  const trimmed = incidents.slice(0, MAX_INCIDENTS);
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: INCIDENTS_KEY } },
    create: { tenantId, key: INCIDENTS_KEY, value: JSON.stringify(trimmed) },
    update: { value: JSON.stringify(trimmed) },
  });
}

export async function recordOperationalIncident(
  tenantId: string,
  input: Omit<OperationalIncident, 'id' | 'tenantId' | 'status' | 'createdAt'> & {
    status?: 'open' | 'resolved';
  },
) {
  const incident: OperationalIncident = {
    id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    tenantId,
    status: input.status ?? 'open',
    createdAt: new Date().toISOString(),
    ...input,
  };

  const existing = await readIncidents(tenantId);
  await writeIncidents(tenantId, [incident, ...existing]);

  logStructured(input.severity === 'critical' ? 'error' : 'warn', 'operational_incident', {
    tenantId,
    correlationId: input.correlationId,
    workflowId: input.workflowId,
    eventId: input.eventId,
    category: input.category,
    title: input.title,
    detail: input.detail,
  });

  return incident;
}

export async function listOperationalIncidents(tenantId: string, includeResolved = false) {
  const all = await readIncidents(tenantId);
  return includeResolved ? all : all.filter((i) => i.status === 'open');
}

export async function resolveOperationalIncident(tenantId: string, incidentId: string) {
  const all = await readIncidents(tenantId);
  const updated = all.map((i) =>
    i.id === incidentId
      ? { ...i, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
      : i,
  );
  await writeIncidents(tenantId, updated);
  return updated.find((i) => i.id === incidentId);
}
