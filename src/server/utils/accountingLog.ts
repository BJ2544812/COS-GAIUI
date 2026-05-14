/**
 * Structured logs for security-sensitive paths (webhooks, idempotency).
 * Uses stdout; in production, forward JSON lines to your log stack.
 */
export function accountingLog(
  scope: string,
  event: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      scope,
      event,
      ...data,
    })
  );
}
