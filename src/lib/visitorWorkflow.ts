/**
 * Canonical visitor workflow (Sunday & Events hardening).
 *
 * Ownership without schema changes:
 * 1. Visitors & Outreach — canonical register + follow-up queue (Contact + OutreachFollowUp)
 * 2. Attendance — operational headcount; visitor check-in also registers in Outreach
 * 3. Members intake — membership path when guest is ready to join (Member growthStage=Visitor)
 */
import { apiRequest } from '@/lib/apiClient';

export const VISITOR_WORKFLOW = {
  canonicalModule: 'outreach' as const,
  canonicalLabel: 'Visitors & Outreach',
  attendanceRole: 'Records Sunday headcount and syncs guests to the follow-up queue.',
  intakeRole: 'Creates a Member record when a guest is ready for membership onboarding.',
} as const;

export type RegisterVisitorPayload = {
  name: string;
  email?: string;
  phone?: string;
  source: 'Sunday' | 'Attendance' | 'Event' | 'Manual';
};

/** Register or update outreach Contact + follow-up (idempotent by email/phone/name). */
export async function registerVisitorForFollowUp(payload: RegisterVisitorPayload): Promise<void> {
  const name = payload.name.trim();
  if (!name) throw new Error('Visitor name is required.');
  await apiRequest('outreach/visitors', {
    method: 'POST',
    body: {
      name,
      email: payload.email?.trim() || undefined,
      phone: payload.phone?.trim() || undefined,
      source: payload.source,
    },
  });
}
