import { randomUUID } from 'node:crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type StructuredLogFields = {
  correlationId?: string;
  tenantId?: string;
  workflowId?: string;
  eventId?: string;
  userId?: string;
  module?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  [key: string]: unknown;
};

export function newCorrelationId(): string {
  return randomUUID();
}

export function logStructured(level: LogLevel, event: string, fields: StructuredLogFields = {}) {
  const line = {
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  };
  const out = JSON.stringify(line);
  if (level === 'error') console.error(out);
  else if (level === 'warn') console.warn(out);
  else console.log(out);
}
