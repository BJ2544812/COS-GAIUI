import { prisma } from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

export const HR_SETTINGS_KEY = 'hr.settings';
export const HR_LEAVE_DEFAULTS_LEGACY_KEY = 'hr.leave.defaults';

export const SYSTEM_LEAVE_DEFAULTS: Record<string, number> = {
  Annual: 15,
  Sick: 10,
  Spiritual: 5,
};

export class HRRepository {
  static async getHrSettingsRaw(tenantId: string) {
    const row = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HR_SETTINGS_KEY } },
    });
    if (row?.value) {
      try {
        return JSON.parse(row.value) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    const legacy = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: HR_LEAVE_DEFAULTS_LEGACY_KEY } },
    });
    if (legacy?.value) {
      try {
        return { leaveDefaults: JSON.parse(legacy.value) };
      } catch {
        return null;
      }
    }
    return null;
  }

  static async saveHrSettings(tenantId: string, payload: Record<string, unknown>) {
    return prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: HR_SETTINGS_KEY } },
      update: { value: JSON.stringify(payload) },
      create: { tenantId, key: HR_SETTINGS_KEY, value: JSON.stringify(payload) },
    });
  }

  static employmentProfiles(tenantId: string) {
    return prisma.employmentProfile.findMany({
      where: { tenantId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            department: true,
            workforceClass: true,
            employmentType: true,
            reportingManagerId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static leaveRequests(tenantId: string, where?: Prisma.LeaveRequestWhereInput) {
    return prisma.leaveRequest.findMany({
      where: { tenantId, ...where },
      include: { member: { select: { id: true, name: true, email: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static leaveBalances(tenantId: string, memberId?: string) {
    return prisma.leaveBalance.findMany({
      where: { tenantId, ...(memberId ? { memberId } : {}) },
      include: { member: { select: { id: true, name: true } } },
    });
  }

  static payrollStructures(tenantId: string) {
    return prisma.payrollStructure.findMany({
      where: { tenantId },
      include: { member: { select: { id: true, name: true, email: true, department: true } } },
    });
  }

  static reimbursements(tenantId: string, where?: Prisma.ReimbursementRequestWhereInput) {
    return prisma.reimbursementRequest.findMany({
      where: { tenantId, ...where },
      include: { member: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static staffDocuments(tenantId: string, where?: Prisma.StaffDocumentWhereInput) {
    return prisma.staffDocument.findMany({
      where: { tenantId, ...where },
      include: { member: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async commandCenterCounts(tenantId: string) {
    const [
      activeStaff,
      pendingLeave,
      pendingReimbursements,
      openOnboarding,
      payrollStructures,
      pendingRecruitment,
    ] = await Promise.all([
      prisma.employmentProfile.count({ where: { tenantId, status: 'Active' } }),
      prisma.leaveRequest.count({ where: { tenantId, status: 'Pending' } }),
      prisma.reimbursementRequest.count({ where: { tenantId, status: 'Pending' } }),
      prisma.onboardingTask.count({ where: { tenantId, isCompleted: false } }),
      prisma.payrollStructure.count({ where: { tenantId, isActive: true } }),
      prisma.recruitmentPipeline.count({
        where: { tenantId, stage: { notIn: ['Hired', 'Rejected'] } },
      }),
    ]);
    return {
      activeStaff,
      pendingLeave,
      pendingReimbursements,
      openOnboarding,
      payrollStructures,
      pendingRecruitment,
    };
  }
}
