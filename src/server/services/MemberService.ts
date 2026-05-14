import { MemberRepository } from '../repositories/MemberRepository.js';
import { Prisma } from '@prisma/client';
import { CodedError } from '../utils/apiErrors.js';
import { EventBus } from '../events/eventBus.js';

function normalizeDates(data: any) {
  const toISO = (val?: string | null) => {
    if (!val || val === "") return null;
    try {
      return new Date(val).toISOString();
    } catch (e) {
      return null;
    }
  };

  return {
    ...data,
    membershipDate: toISO(data.membershipDate),
    dob: toISO(data.dob),
  };
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
  if (o.role !== undefined) data.role = typeof o.role === 'string' ? o.role.trim() : null;
  if (o.gender !== undefined) data.gender = typeof o.gender === 'string' ? o.gender.trim() : null;
  if (o.aadhaar !== undefined) data.aadhaar = typeof o.aadhaar === 'string' ? o.aadhaar.trim() : null;
  if (o.pan !== undefined) data.pan = typeof o.pan === 'string' ? o.pan.trim() : null;
  if (o.status !== undefined) data.status = typeof o.status === 'string' ? o.status.trim() : undefined;
  if (o.growthStage !== undefined) data.growthStage = typeof o.growthStage === 'string' ? o.growthStage.trim() : undefined;

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
  const validGrowthStages = ['Visitor', 'Member', 'Leader', 'NewBeliever', 'Staff'];
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

  data.dob = o.dob as any;
  data.membershipDate = o.membershipDate as any;

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

  static async getMembers(tenantId: string) {
    return MemberRepository.findAll(tenantId);
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
