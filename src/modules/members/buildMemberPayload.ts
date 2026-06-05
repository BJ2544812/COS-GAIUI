import type { MemberCreateBody, MemberUpdateBody } from './memberApi';
import { parseDateOnlyToISO } from '@/lib/dateOnly';

/** Spiritual growth track checkboxes (step 4) — persisted as SpiritualMilestone rows. */
export const INTAKE_SPIRITUAL_TRACK_LABELS = [
  'Baptized',
  'Membership Class',
  'Volunteer Trained',
  'Group Leader',
] as const;

export type IntakeSpiritualTrackLabel = (typeof INTAKE_SPIRITUAL_TRACK_LABELS)[number];

/** Maps intake checkbox labels → `SpiritualMilestone.type` (Prisma). */
export function milestoneSpecFromTrackLabel(
  label: IntakeSpiritualTrackLabel,
): { type: string; notes?: string } {
  switch (label) {
    case 'Baptized':
      return { type: 'Baptism' };
    case 'Membership Class':
      return { type: 'MembershipClass' };
    case 'Volunteer Trained':
      return { type: 'Other', notes: 'Volunteer training completed (intake)' };
    case 'Group Leader':
      return { type: 'SmallGroupLeader' };
    default:
      return { type: 'Other', notes: `Track: ${String(label)}` };
  }
}

/** Fields read from the intake wizard for API create; extra keys on the form are ignored by the API layer. */
export type IntakeFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  joinDate: string;
  familyRole: string;
  campus: string;
  growthStage: 'Visitor' | 'Member';
  birthDate: string;
  gender: string;
  familyName: string;
  /** Checkbox label → selected */
  spiritualTrack?: Partial<Record<IntakeSpiritualTrackLabel, boolean>>;
  aadhaar?: string;
  pan?: string;
  /** India / compliance: record that declaration policy was accepted at intake */
  declarationAccepted?: boolean;
};

/**
 * Map intake wizard fields to the backend `Member` create body (no undefined keys).
 */
export function buildCreatePayloadFromIntake(form: IntakeFormData & Record<string, unknown>): MemberCreateBody {
  const first = form.firstName?.trim() ?? '';
  const last = form.lastName?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ').trim();
  if (!name) {
    throw new Error('First and last name are required.');
  }

  const body: MemberCreateBody = {
    name,
    status: 'Active',
    growthStage: form.growthStage === 'Member' ? 'Member' : 'Visitor',
  };

  const email = form.email?.trim();
  if (email) body.email = email;

  const phone = form.phone?.trim();
  if (phone) body.phone = phone;

  if (form.joinDate) {
    body.membershipDate = parseDateOnlyToISO(form.joinDate) ?? undefined;
  }

  const bd = typeof form.birthDate === 'string' ? form.birthDate.trim() : '';
  if (bd) {
    body.dob = parseDateOnlyToISO(bd) ?? undefined;
  }

  const g = typeof form.gender === 'string' ? form.gender.trim() : '';
  if (g) body.gender = g;

  const aadhaar = typeof form.aadhaar === 'string' ? form.aadhaar.replace(/\s/g, '') : '';
  if (aadhaar) body.aadhaar = aadhaar;

  const pan = typeof form.pan === 'string' ? form.pan.trim().toUpperCase() : '';
  if (pan) body.pan = pan;

  const roleParts: string[] = [];
  const fr = form.familyRole?.trim();
  if (fr) roleParts.push(fr);
  const campus = form.campus?.trim();
  if (campus) roleParts.push(`Campus: ${campus}`);
  if (roleParts.length) body.role = roleParts.join(' · ');

  return body;
}

/**
 * For updates: only include fields the user is allowed to change; omit undefined.
 */
/** Map member profile edit form → API update body (explicit fields only). */
export function buildMemberUpdateFromEditForm(form: {
  name: string;
  email: string;
  phone: string;
  status: string;
  growthStage: string;
  role: string;
  membershipDate: string;
  dob: string;
  gender: string;
  aadhaar: string;
  pan: string;
  familyId: string;
  workforceClass: string;
  employmentType: string;
  department: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateRegion: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
}): MemberUpdateBody {
  return {
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    status: form.status,
    growthStage: form.growthStage,
    role: form.role.trim() || null,
    membershipDate: form.membershipDate || null,
    dob: form.dob || null,
    gender: form.gender.trim() || null,
    aadhaar: form.aadhaar.replace(/\s/g, '') || null,
    pan: form.pan.trim().toUpperCase() || null,
    familyId: form.familyId || null,
    workforceClass: form.workforceClass.trim() || null,
    employmentType: form.employmentType.trim() || null,
    department: form.department.trim() || null,
    addressLine1: form.addressLine1.trim() || null,
    addressLine2: form.addressLine2.trim() || null,
    city: form.city.trim() || null,
    stateRegion: form.stateRegion.trim() || null,
    postalCode: form.postalCode.trim() || null,
    country: form.country.trim() || 'India',
    latitude: form.latitude ? Number(form.latitude) : null,
    longitude: form.longitude ? Number(form.longitude) : null,
  };
}

export function buildUpdatePayload(updates: MemberUpdateBody): Record<string, unknown> {
  const src = updates as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}
