import { prisma } from '../utils/prisma.js';
import { AccountingService } from './AccountingService.js';
import {
  HRRepository,
  SYSTEM_LEAVE_DEFAULTS,
} from '../repositories/HRRepository.js';
import type { TenantRequest } from '../middleware/tenant.middleware.js';
import {
  isAuthorizedForHRCompensation,
  isAuthorizedForHRManager,
  maskPayrollStructure,
} from '../utils/hrSecurity.js';

export type LeaveConflictItem = {
  kind: 'event' | 'ministry' | 'worship' | 'sunday';
  severity: 'high' | 'medium';
  entityId: string;
  name: string;
  date?: string;
  assignedRole: string;
  entityType: string;
  message: string;
};

export type LeaveConflictReport = {
  hasConflict: boolean;
  conflicts: LeaveConflictItem[];
  warnings: string[];
};

function calculateDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
}

export class HRService {
  static async resolveLeaveDefaults(tenantId: string): Promise<Record<string, number>> {
    const raw = await HRRepository.getHrSettingsRaw(tenantId);
    const fromSettings =
      raw && typeof raw === 'object' && raw.leaveDefaults && typeof raw.leaveDefaults === 'object'
        ? (raw.leaveDefaults as Record<string, number>)
        : null;
    if (fromSettings && Object.keys(fromSettings).length > 0) return fromSettings;
    return { ...SYSTEM_LEAVE_DEFAULTS };
  }

  static async getSettings(tenantId: string) {
    const raw = ((await HRRepository.getHrSettingsRaw(tenantId)) ?? {}) as Record<string, unknown>;
    const leaveDefaults = await this.resolveLeaveDefaults(tenantId);
    return {
      leaveDefaults,
      leaveTypeLabels: (raw.leaveTypeLabels as Record<string, string> | undefined) ?? {
        Annual: 'Annual Leave',
        Sick: 'Sick Leave',
        Spiritual: 'Spiritual / Retreat Leave',
      },
      policies: (raw.policies as Record<string, unknown> | undefined) ?? {},
    };
  }

  static async updateSettings(tenantId: string, input: { leaveDefaults?: Record<string, number>; leaveTypeLabels?: Record<string, string>; policies?: Record<string, unknown> }) {
    const existing = (await HRRepository.getHrSettingsRaw(tenantId)) ?? {};
    const merged = {
      ...existing,
      ...(input.leaveDefaults ? { leaveDefaults: input.leaveDefaults } : {}),
      ...(input.leaveTypeLabels ? { leaveTypeLabels: input.leaveTypeLabels } : {}),
      ...(input.policies ? { policies: input.policies } : {}),
    };
    await HRRepository.saveHrSettings(tenantId, merged);
    return this.getSettings(tenantId);
  }

  static async getUserMemberId(userId: string): Promise<string | null> {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { memberId: true } });
    return u?.memberId ?? null;
  }

  /**
   * Ministry roster conflict intelligence: events, worship, Sunday services, ministry assignments.
   */
  static async scanLeaveConflicts(
    tenantId: string,
    memberId: string,
    startDate: string,
    endDate: string,
  ): Promise<LeaveConflictReport> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const conflicts: LeaveConflictItem[] = [];
    const warnings: string[] = [];

    const responsibilities = await prisma.memberResponsibility.findMany({
      where: { tenantId, memberId, status: 'Active' },
    });

    const eventIds = responsibilities
      .filter((r) => r.entityType === 'Event' && r.entityId)
      .map((r) => r.entityId!) ;

    if (eventIds.length > 0) {
      const overlappingEvents = await prisma.event.findMany({
        where: {
          tenantId,
          id: { in: eventIds },
          status: { notIn: ['CANCELLED', 'ARCHIVED', 'COMPLETED'] },
          date: { gte: start, lte: end },
        },
      });
      for (const event of overlappingEvents) {
        const resp = responsibilities.find((r) => r.entityId === event.id);
        const isSunday = /service|sunday/i.test(event.type) || /sunday/i.test(event.name);
        const isWorship = /worship/i.test(event.type) || /worship/i.test(resp?.role ?? '');
        conflicts.push({
          kind: isSunday ? 'sunday' : isWorship ? 'worship' : 'event',
          severity: isSunday || isWorship ? 'high' : 'medium',
          entityId: event.id,
          name: event.name,
          date: event.date.toISOString(),
          assignedRole: resp?.role ?? 'Staff',
          entityType: 'Event',
          message: isSunday
            ? `Sunday operations: assigned to "${event.name}" on ${event.date.toISOString().slice(0, 10)}`
            : isWorship
              ? `Worship assignment: "${resp?.role}" for ${event.name}`
              : `Event staffing: ${event.name}`,
        });
      }
    }

    const ministryAssignments = responsibilities.filter(
      (r) => r.entityType === 'Ministry' || r.entityType === 'Department',
    );
    for (const r of ministryAssignments) {
      conflicts.push({
        kind: 'ministry',
        severity: 'medium',
        entityId: r.entityId ?? r.id,
        name: r.role,
        assignedRole: r.role,
        entityType: r.entityType,
        message: `Active ministry role: ${r.role} (${r.entityType})`,
      });
      warnings.push(`Coverage needed for ministry role "${r.role}" during leave.`);
    }

    const worshipRoles = responsibilities.filter(
      (r) =>
        /worship|music|choir|band|media team/i.test(r.role) &&
        r.entityType !== 'Event',
    );
    for (const r of worshipRoles) {
      if (conflicts.some((c) => c.assignedRole === r.role && c.kind === 'worship')) continue;
      conflicts.push({
        kind: 'worship',
        severity: 'high',
        entityId: r.entityId ?? r.id,
        name: r.role,
        assignedRole: r.role,
        entityType: r.entityType,
        message: `Worship team assignment: ${r.role}`,
      });
    }

    const sundayEvents = await prisma.event.findMany({
      where: {
        tenantId,
        type: { in: ['Service', 'Sunday', 'Worship'] },
        status: { notIn: ['CANCELLED', 'ARCHIVED', 'COMPLETED'] },
        date: { gte: start, lte: end },
      },
      take: 20,
    });
    if (responsibilities.some((r) => r.entityType === 'Event') && sundayEvents.length > 0 && conflicts.length === 0) {
      warnings.push(
        `${sundayEvents.length} church service(s) fall within this leave window — confirm volunteer substitutes.`,
      );
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      warnings,
    };
  }

  static async allocateLeaveBalances(tenantId: string, memberId: string, year = new Date().getFullYear()) {
    const defaults = await this.resolveLeaveDefaults(tenantId);
    for (const [type, days] of Object.entries(defaults)) {
      await prisma.leaveBalance.upsert({
        where: {
          tenantId_memberId_leaveType_year: { tenantId, memberId, leaveType: type, year },
        },
        update: {},
        create: { tenantId, memberId, leaveType: type, year, allocated: days, used: 0 },
      });
    }
  }

  static async getCommandCenter(tenantId: string) {
    const counts = await HRRepository.commandCenterCounts(tenantId);
    const recentLeave = await prisma.leaveRequest.findMany({
      where: { tenantId, status: 'Pending' },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { name: true } } },
    });
    const recentReimbursements = await prisma.reimbursementRequest.findMany({
      where: { tenantId, status: 'Pending' },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { member: { select: { name: true } } },
    });
    const payrollRuns = await prisma.payrollRun.findMany({
      where: { tenantId, status: { not: 'Closed' } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    return { counts, recentLeave, recentReimbursements, payrollRuns };
  }

  static filterPayrollForViewer<T extends Record<string, unknown>>(
    req: TenantRequest,
    rows: T[],
  ): T[] {
    if (isAuthorizedForHRCompensation(req)) return rows;
    return rows.map((r) => maskPayrollStructure(r));
  }

  static canViewCompensation(req: TenantRequest): boolean {
    return isAuthorizedForHRCompensation(req);
  }

  static canManageHR(req: TenantRequest): boolean {
    return isAuthorizedForHRManager(req);
  }

  static async approveLeave(
    tenantId: string,
    leaveId: string,
    approverUserId: string,
    opts?: { forceApprove?: boolean; notes?: string },
  ) {
    const existing = await prisma.leaveRequest.findFirst({
      where: { id: leaveId, tenantId },
      include: { member: { select: { name: true } } },
    });
    if (!existing) throw new Error('Leave request not found.');

    const report = await this.scanLeaveConflicts(
      tenantId,
      existing.memberId,
      existing.startDate.toISOString(),
      existing.endDate.toISOString(),
    );

    if (report.hasConflict && !opts?.forceApprove) {
      const err = new Error('Leave approval blocked: ministry staffing conflicts detected.');
      (err as any).code = 'LEAVE_CONFLICT';
      (err as any).conflicts = report;
      throw err;
    }

    const days = calculateDays(existing.startDate, existing.endDate);
    const year = existing.startDate.getFullYear();

    if (existing.status !== 'Approved') {
      let balance = await prisma.leaveBalance.findUnique({
        where: {
          tenantId_memberId_leaveType_year: {
            tenantId,
            memberId: existing.memberId,
            leaveType: existing.leaveType,
            year,
          },
        },
      });
      if (!balance) {
        const defaults = await this.resolveLeaveDefaults(tenantId);
        balance = await prisma.leaveBalance.create({
          data: {
            tenantId,
            memberId: existing.memberId,
            leaveType: existing.leaveType,
            year,
            allocated: defaults[existing.leaveType] ?? 0,
            used: 0,
          },
        });
      }
      if (balance.used + days > balance.allocated) {
        throw new Error(
          `Insufficient ${existing.leaveType} balance (${balance.used}/${balance.allocated} used).`,
        );
      }
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { used: { increment: days } },
      });
    }

    return prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: 'Approved',
        approvedByUserId: approverUserId,
        notes: opts?.notes ?? existing.notes,
        conflictSnapshot: report as unknown as object,
      },
    });
  }

  static async generatePayrollRunFromStructures(
    tenantId: string,
    periodYear: number,
    periodMonth: number,
    actorUserId?: string,
  ) {
    const structures = await prisma.payrollStructure.findMany({
      where: { tenantId, isActive: true },
      include: { member: { select: { name: true } } },
    });
    if (!structures.length) throw new Error('No active payroll structures configured.');

    const lines = structures.map((s) => ({
      memberId: s.memberId,
      grossAmount: Number(s.baseSalary) + Number(s.allowances),
      deductionAmount: Number(s.deductions),
      salaryExpenseAccountId: s.salaryExpenseAccountId,
      payrollPayableAccountId: s.payrollPayableAccountId,
    }));

    return AccountingService.createPayrollRun(
      tenantId,
      {
        periodYear,
        periodMonth,
        lines,
      },
      {
        approvedByUserId: actorUserId ?? null,
        postedByUserId: actorUserId ?? null,
      },
    );
  }
}
