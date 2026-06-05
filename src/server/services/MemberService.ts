import { MemberRepository } from '../repositories/MemberRepository.js';
import { Prisma } from '@prisma/client';
import { CodedError } from '../utils/apiErrors.js';
import { EventBus } from '../events/eventBus.js';
import { parseDateOnlyToISO } from '../../lib/dateOnly.js';

function normalizeDates<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data };
  if ('membershipDate' in out) {
    (out as Record<string, unknown>).membershipDate = parseDateOnlyToISO(
      out.membershipDate as string | null | undefined,
    );
  }
  if ('dob' in out) {
    (out as Record<string, unknown>).dob = parseDateOnlyToISO(
      out.dob as string | null | undefined,
    );
  }
  return out;
}

function parseMemberUpdate(body: unknown): Prisma.MemberUpdateInput {
  if (body == null || typeof body !== 'object') {
    throw new CodedError('BAD_INPUT', 'Invalid request body');
  }
  const o = body as Record<string, unknown>;
  const data: Prisma.MemberUpdateInput = {};

  if (typeof o.name === 'string' && o.name.trim()) data.name = o.name.trim();
  if (o.email !== undefined) data.email = typeof o.email === 'string' ? o.email.trim() : null;
  if (o.phone !== undefined) data.phone = typeof o.phone === 'string' ? o.phone.trim() : null;
  if (o.role !== undefined) data.role = typeof o.role === 'string' ? (o.role.trim() || null) : null;
  if (o.gender !== undefined) {
    data.gender = typeof o.gender === 'string' ? (o.gender.trim() || null) : null;
  }
  if (o.aadhaar !== undefined) data.aadhaar = typeof o.aadhaar === 'string' ? o.aadhaar.trim() : null;
  if (o.pan !== undefined) data.pan = typeof o.pan === 'string' ? o.pan.trim() : null;
  if (o.status !== undefined) data.status = typeof o.status === 'string' ? o.status.trim() : undefined;
  if (o.growthStage !== undefined) data.growthStage = typeof o.growthStage === 'string' ? o.growthStage.trim() : undefined;
  if (o.workforceClass !== undefined) {
    data.workforceClass = typeof o.workforceClass === 'string' ? o.workforceClass.trim() || null : null;
  }
  if (o.employmentType !== undefined) {
    data.employmentType = typeof o.employmentType === 'string' ? o.employmentType.trim() || null : null;
  }
  if (o.department !== undefined) {
    data.department = typeof o.department === 'string' ? o.department.trim() || null : null;
  }

  const addressFields = ['addressLine1', 'addressLine2', 'city', 'stateRegion', 'postalCode', 'country'] as const;
  for (const key of addressFields) {
    if (o[key] !== undefined) {
      (data as any)[key] = typeof o[key] === 'string' ? (o[key] as string).trim() || null : null;
    }
  }
  if (o.latitude !== undefined) {
    const lat = o.latitude === null || o.latitude === '' ? null : Number(o.latitude);
    (data as any).latitude = lat != null && !Number.isNaN(lat) ? lat : null;
  }
  if (o.longitude !== undefined) {
    const lng = o.longitude === null || o.longitude === '' ? null : Number(o.longitude);
    (data as any).longitude = lng != null && !Number.isNaN(lng) ? lng : null;
  }

  if (o.dob !== undefined) data.dob = o.dob;
  if (o.membershipDate !== undefined) data.membershipDate = o.membershipDate;

  if (o.familyId !== undefined) {
    if (o.familyId === null || o.familyId === '') {
      data.family = { disconnect: true };
    } else {
      data.family = { connect: { id: o.familyId as string } };
    }
  }

  return data;
}

function parseMemberCreate(body: unknown): Omit<Prisma.MemberCreateInput, 'tenant'> {
  if (body == null || typeof body !== 'object') {
    throw new CodedError('BAD_INPUT', 'Invalid request body');
  }
  const o = body as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : String(o.name ?? '').trim();
  if (!name) {
    throw new CodedError('BAD_INPUT', 'Name is required');
  }

  const growthRaw = typeof o.growthStage === 'string' ? o.growthStage.trim() : '';
  const validGrowthStages = ['Visitor', 'NewBeliever', 'Member', 'Volunteer', 'Leader', 'CoreTeam', 'Staff'];
  const growthStage = validGrowthStages.includes(growthRaw) ? growthRaw : 'Visitor';

  const statusRaw = typeof o.status === 'string' ? o.status.trim() : '';
  const status = statusRaw || 'Active';

  const data: Omit<Prisma.MemberCreateInput, 'tenant'> = {
    name,
    status,
    growthStage,
  };

  if (typeof o.email === 'string' && o.email.trim()) data.email = o.email.trim();
  if (typeof o.phone === 'string' && o.phone.trim()) data.phone = o.phone.trim();
  if (typeof o.role === 'string' && o.role.trim()) data.role = o.role.trim();
  if (typeof o.gender === 'string' && o.gender.trim()) data.gender = o.gender.trim();
  if (typeof o.aadhaar === 'string' && o.aadhaar.trim()) data.aadhaar = o.aadhaar.trim();
  if (typeof o.pan === 'string' && o.pan.trim()) data.pan = o.pan.trim();
  if (typeof o.workforceClass === 'string' && o.workforceClass.trim()) {
    data.workforceClass = o.workforceClass.trim();
  }
  if (typeof o.employmentType === 'string' && o.employmentType.trim()) {
    data.employmentType = o.employmentType.trim();
  }
  if (typeof o.department === 'string' && o.department.trim()) {
    data.department = o.department.trim();
  }

  const addressFields = ['addressLine1', 'addressLine2', 'city', 'stateRegion', 'postalCode', 'country'] as const;
  for (const key of addressFields) {
    if (typeof o[key] === 'string' && (o[key] as string).trim()) {
      (data as any)[key] = (o[key] as string).trim();
    }
  }
  if (o.latitude !== undefined) {
    const lat = o.latitude === null || o.latitude === '' ? null : Number(o.latitude);
    (data as any).latitude = lat != null && !Number.isNaN(lat) ? lat : undefined;
  }
  if (o.longitude !== undefined) {
    const lng = o.longitude === null || o.longitude === '' ? null : Number(o.longitude);
    (data as any).longitude = lng != null && !Number.isNaN(lng) ? lng : undefined;
  }

  if (o.dob !== undefined && o.dob !== null && o.dob !== '') data.dob = o.dob as any;
  if (o.membershipDate !== undefined && o.membershipDate !== null && o.membershipDate !== '') {
    data.membershipDate = o.membershipDate as any;
  }

  const fid = o.familyId;
  if (typeof fid === 'string' && fid.trim()) {
    data.family = { connect: { id: fid.trim() } };
  }

  return data;
}

export class MemberService {
  static async createMember(tenantId: string, body: unknown) {
    const rawData = parseMemberCreate(body);
    const cleanData = normalizeDates(rawData);
    const member = await MemberRepository.create(tenantId, cleanData as any);
    
    await EventBus.publish({
      eventName: 'MemberCreated',
      tenantId,
      entityId: member.id,
      entityType: 'Member',
      payload: { name: member.name, email: member.email, status: member.status }
    });
    
    return member;
  }

  static async getMembers(tenantId: string, familyId?: string) {
    return MemberRepository.findAll(tenantId, familyId);
  }

  static async importMembers(tenantId: string, rows: unknown[]) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new CodedError('BAD_INPUT', 'rows array is required');
    }
    if (rows.length > 100) {
      throw new CodedError('BAD_INPUT', 'Maximum 100 rows per import');
    }
    const created: string[] = [];
    const errors: { index: number; message: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const member = await this.createMember(tenantId, rows[i]);
        created.push(member.id);
      } catch (e: unknown) {
        errors.push({ index: i, message: e instanceof Error ? e.message : String(e) });
      }
    }
    return { created: created.length, errors, memberIds: created };
  }

  static async getMemberById(tenantId: string, id: string) {
    return MemberRepository.findById(tenantId, id);
  }

  static async updateMember(tenantId: string, id: string, body: unknown) {
    const data = parseMemberUpdate(body);
    const cleanData = normalizeDates(data);
    return MemberRepository.update(tenantId, id, cleanData);
  }

  static async deleteMember(tenantId: string, id: string) {
    return MemberRepository.delete(tenantId, id);
  }
}
