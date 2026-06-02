import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { prisma } from '../utils/prisma.js';
import { AccountingService } from '../services/AccountingService.js';
import { HRService } from '../services/HRService.js';
import {
  isAuthorizedForHRCompensation,
  isAuthorizedForHRManager,
} from '../utils/hrSecurity.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { cacheThrough, cacheInvalidatePrefix } from '../utils/opsCache.js';

export { isAuthorizedForHRCompensation, isAuthorizedForHRManager } from '../utils/hrSecurity.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/** Ensure local uploads directory exists */
function ensureUploadsDir(subdir: string) {
  const dir = path.join(UPLOADS_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Store file to local disk */
async function storeFile(
  file: Express.Multer.File,
  objectName: string
): Promise<string> {
  const dir = ensureUploadsDir(path.dirname(objectName));
  const filename = path.basename(objectName);
  const filePath = path.join(dir, filename);
  fs.writeFileSync(filePath, file.buffer);
  
  // Return the path starting with /uploads so express.static handles it
  return `/uploads/${objectName}`;
}

async function getUserMemberId(userId: string): Promise<string | null> {
  return HRService.getUserMemberId(userId);
}

/**
 * Calculate leave request duration in integer days.
 */
function calculateDays(startDate: string | Date, endDate: string | Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

type PaginationInput = { page: number; pageSize: number; skip: number };

function parsePagination(query: Record<string, unknown>): PaginationInput {
  const rawPage = Number(query.page ?? 1);
  const rawPageSize = Number(query.pageSize ?? 25);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const boundedSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.floor(rawPageSize) : 25;
  const pageSize = Math.min(100, boundedSize);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export class HRController {

  static async getCommandCenter(req: TenantRequest, res: Response) {
    try {
      const data = await HRService.getCommandCenter(req.tenantId!);
      const canComp = HRService.canViewCompensation(req);
      res.status(200).json({
        status: 'success',
        data: {
          ...data,
          canViewCompensation: canComp,
          payrollRuns: canComp
            ? data.payrollRuns
            : data.payrollRuns.map((r) => ({ ...r, totalNet: undefined, totalGross: undefined })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getSettings(req: TenantRequest, res: Response) {
    try {
      const data = await HRService.getSettings(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateSettings(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Requires Admin/HR permissions.' });
      }
      const { leaveDefaults, defaults, leaveTypeLabels, policies } = req.body;
      const mergedDefaults = leaveDefaults ?? defaults;
      const data = await HRService.updateSettings(req.tenantId!, {
        leaveDefaults: mergedDefaults,
        leaveTypeLabels,
        policies,
      });
      res.status(200).json({ status: 'success', data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async generatePayrollRun(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Restricted' });
      }
      const { periodYear, periodMonth } = req.body;
      const y = Number(periodYear) || new Date().getFullYear();
      const m = Number(periodMonth) || new Date().getMonth() + 1;
      const run = await HRService.generatePayrollRunFromStructures(req.tenantId!, y, m, req.user?.id);
      res.status(201).json({ status: 'success', data: run });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // =========================================================
  // Employment Profiles
  // =========================================================

  static async getEmploymentProfiles(req: TenantRequest, res: Response) {
    try {
      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = { tenantId: req.tenantId! };
      const cacheKey = `employment-profiles:${req.tenantId!}:${page}:${pageSize}`;
      const [total, profiles] = await Promise.all([
        cacheThrough(`${cacheKey}:count`, 8000, () => prisma.employmentProfile.count({ where })),
        prisma.employmentProfile.findMany({
          where,
          select: {
            id: true,
            memberId: true,
            startDate: true,
            endDate: true,
            status: true,
            jobTitle: true,
            emergencyContact: true,
            notes: true,
            member: {
              select: { id: true, name: true, department: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: profiles, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createEmploymentProfile(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Requires Admin/HR privilege' });
      }
      const { memberId, startDate, endDate, status, jobTitle, emergencyContact, notes } = req.body;
      if (!memberId) return res.status(400).json({ error: 'memberId is required' });

      const profile = await prisma.employmentProfile.create({
        data: {
          tenantId: req.tenantId!,
          memberId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          status: status || 'Active',
          jobTitle,
          emergencyContact: emergencyContact || null,
          notes
        }
      });

      // Update Member workforce attributes automatically
      await prisma.member.updateMany({
        where: { id: memberId, tenantId: req.tenantId! },
        data: {
          workforceClass: 'staff',
          growthStage: 'Staff',
          employmentType: 'FullTime'
        }
      });

      // Automatically allocate leave balances
      await HRService.allocateLeaveBalances(req.tenantId!, memberId);

      cacheInvalidatePrefix(`employment-profiles:${req.tenantId!}:`);
      res.status(201).json({ status: 'success', data: profile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updateEmploymentProfile(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { id } = req.params;
      const { startDate, endDate, status, jobTitle, emergencyContact, notes } = req.body;

      const existing = await prisma.employmentProfile.findFirst({
        where: { id: id as string, tenantId: req.tenantId! },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Employment profile not found.' });
      }
      const profile = await prisma.employmentProfile.update({
        where: { id: id as string },
        data: {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : null,
          status,
          jobTitle,
          emergencyContact,
          notes
        }
      });
      cacheInvalidatePrefix(`employment-profiles:${req.tenantId!}:`);
      res.status(200).json({ status: 'success', data: profile });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteEmploymentProfile(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { id } = req.params;
      const existing = await prisma.employmentProfile.findFirst({
        where: { id: id as string, tenantId: req.tenantId! },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Employment profile not found.' });
      }
      await prisma.employmentProfile.delete({ where: { id: id as string } });
      cacheInvalidatePrefix(`employment-profiles:${req.tenantId!}:`);
      res.status(200).json({ status: 'success', message: 'Employment profile deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Leave Roster Conflict & Workflows
  // =========================================================

  static async checkLeaveConflictsHandler(req: TenantRequest, res: Response) {
    try {
      const { memberId, startDate, endDate } = req.query;
      if (!memberId || !startDate || !endDate) {
        return res.status(400).json({ error: 'memberId, startDate, and endDate are required query parameters.' });
      }

      const report = await HRService.scanLeaveConflicts(
        req.tenantId!,
        String(memberId),
        String(startDate),
        String(endDate),
      );

      res.status(200).json({ status: 'success', data: report });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getLeaveRequests(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);
      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isManager && memberId ? { memberId } : {})
      };
      const [total, requests] = await Promise.all([
        prisma.leaveRequest.count({ where }),
        prisma.leaveRequest.findMany({
          where,
          include: {
            member: {
              select: { id: true, name: true, email: true, department: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: requests, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createLeaveRequest(req: TenantRequest, res: Response) {
    try {
      const { memberId, leaveType, startDate, endDate, reason, notes } = req.body;
      if (!leaveType || !startDate || !endDate) {
        return res.status(400).json({ error: 'leaveType, startDate, and endDate are required.' });
      }

      // Allow submitting for self, or require HR manager privilege
      const userMemberId = await getUserMemberId(req.user?.id!);
      const targetMemberId = memberId || userMemberId;
      if (!targetMemberId) {
        return res.status(400).json({ error: 'Could not associate request with a member.' });
      }

      if (targetMemberId !== userMemberId && !isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Cannot submit leave for other staff members.' });
      }

      const report = await HRService.scanLeaveConflicts(
        req.tenantId!,
        targetMemberId,
        startDate,
        endDate,
      );

      const request = await prisma.leaveRequest.create({
        data: {
          tenantId: req.tenantId!,
          memberId: targetMemberId,
          leaveType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          notes:
            notes ||
            (report.hasConflict
              ? `[Conflict Warning] ${report.conflicts.length} staffing conflict(s).`
              : null),
          conflictSnapshot: report as object,
        },
        include: {
          member: { select: { name: true } }
        }
      });

      // Send Admin notification of new leave request
      await prisma.notification.create({
        data: {
          tenantId: req.tenantId!,
          targetRole: 'Admin',
          type: 'LeaveRequestSubmitted',
          title: 'New Leave Request Received',
          message: `${request.member.name} requested ${leaveType} leave from ${startDate} to ${endDate}.`,
          priority: report.hasConflict ? 'HIGH' : 'MEDIUM',
          actionLink: '/hr'
        }
      });

      res.status(201).json({
        status: 'success',
        data: {
          ...request,
          ...report,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async patchLeaveRequest(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });

      const existing = await prisma.leaveRequest.findUnique({
        where: { id: id as string },
        include: { member: { select: { name: true } } }
      });
      if (!existing || existing.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Leave request not found.' });
      }

      // Check self-cancel vs manager approval permissions
      const userMemberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      if (!isManager && existing.memberId !== userMemberId) {
        return res.status(403).json({ error: 'Access Denied: Unauthorized leave modification.' });
      }

      if (status === 'Approved' || status === 'Rejected') {
        if (!isManager) {
          return res.status(403).json({ error: 'Access Denied: Only managers can Approve/Reject leave requests.' });
        }
      }

      let updated;
      if (status === 'Approved' && existing.status !== 'Approved') {
        try {
          updated = await HRService.approveLeave(req.tenantId!, id as string, req.user!.id, {
            forceApprove: Boolean(req.body.forceApprove),
            notes,
          });
        } catch (e: any) {
          if (e.code === 'LEAVE_CONFLICT') {
            return res.status(409).json({
              error: e.message,
              conflicts: e.conflicts,
            });
          }
          throw e;
        }
      } else {
        const days = calculateDays(existing.startDate, existing.endDate);
        const year = existing.startDate.getFullYear();
        if (existing.status === 'Approved' && (status === 'Cancelled' || status === 'Rejected')) {
          const balance = await prisma.leaveBalance.findUnique({
            where: {
              tenantId_memberId_leaveType_year: {
                tenantId: req.tenantId!,
                memberId: existing.memberId,
                leaveType: existing.leaveType,
                year,
              },
            },
          });
          if (balance) {
            await prisma.leaveBalance.update({
              where: { id: balance.id },
              data: { used: { decrement: days } },
            });
          }
        }
        updated = await prisma.leaveRequest.update({
          where: { id: id as string },
          data: {
            status,
            notes,
            approvedByUserId: status === 'Approved' ? req.user?.id : undefined,
          },
        });
      }

      // Fetch user's User row to notify them
      const user = await prisma.user.findFirst({
        where: { tenantId: req.tenantId!, memberId: existing.memberId }
      });
      if (user) {
        await prisma.notification.create({
          data: {
            tenantId: req.tenantId!,
            userId: user.id,
            type: 'LeaveRequestStatusChange',
            title: `Leave Request ${status}`,
            message: `Your ${existing.leaveType} leave request for ${existing.startDate.toISOString().slice(0, 10)} has been ${status.toLowerCase()}.`,
            priority: 'HIGH',
            actionLink: '/hr'
          }
        });
      }

      res.status(200).json({ status: 'success', data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Leave Balances
  // =========================================================

  static async getLeaveBalances(req: TenantRequest, res: Response) {
    try {
      const { memberId } = req.query;
      const userMemberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      const targetMemberId = memberId ? String(memberId) : (!isManager ? (userMemberId || 'none') : undefined);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(targetMemberId ? { memberId: targetMemberId } : {})
      };
      const [total, balances] = await Promise.all([
        prisma.leaveBalance.count({ where }),
        prisma.leaveBalance.findMany({
          where,
          include: {
            member: { select: { id: true, name: true } }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: balances, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async adjustLeaveBalance(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Requires Admin/HR rights.' });
      }
      const { memberId, leaveType, year, allocated, used } = req.body;
      if (!memberId || !leaveType || !year) {
        return res.status(400).json({ error: 'memberId, leaveType, and year are required.' });
      }

      const balance = await prisma.leaveBalance.upsert({
        where: {
          tenantId_memberId_leaveType_year: {
            tenantId: req.tenantId!,
            memberId,
            leaveType,
            year: Number(year)
          }
        },
        update: {
          allocated: allocated !== undefined ? Number(allocated) : undefined,
          used: used !== undefined ? Number(used) : undefined
        },
        create: {
          tenantId: req.tenantId!,
          memberId,
          leaveType,
          year: Number(year),
          allocated: Number(allocated || 0),
          used: Number(used || 0)
        }
      });

      res.status(200).json({ status: 'success', data: balance });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Payroll Structures (Compensation Security Enforcement)
  // =========================================================

  static async getPayrollStructures(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Restricted: Sensitive salary records.' });
      }
      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = { tenantId: req.tenantId! };
      const [total, structures] = await Promise.all([
        prisma.payrollStructure.count({ where }),
        prisma.payrollStructure.findMany({
          where,
          include: {
            member: { select: { id: true, name: true, email: true, department: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({
        status: 'success',
        data: HRService.filterPayrollForViewer(req, structures as Record<string, unknown>[]),
        meta: { page, pageSize, total },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createPayrollStructure(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Restricted' });
      }
      const { memberId, baseSalary, allowances, deductions, salaryExpenseAccountId, payrollPayableAccountId, isActive } = req.body;
      if (!memberId || baseSalary === undefined || !salaryExpenseAccountId || !payrollPayableAccountId) {
        return res.status(400).json({ error: 'memberId, baseSalary, salaryExpenseAccountId, and payrollPayableAccountId are required.' });
      }

      const structure = await prisma.payrollStructure.create({
        data: {
          tenantId: req.tenantId!,
          memberId,
          baseSalary: String(baseSalary) as any,
          allowances: allowances !== undefined ? String(allowances) as any : undefined,
          deductions: deductions !== undefined ? String(deductions) as any : undefined,
          salaryExpenseAccountId,
          payrollPayableAccountId,
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
      });

      res.status(201).json({ status: 'success', data: structure });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async updatePayrollStructure(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Restricted' });
      }
      const { id } = req.params;
      const { baseSalary, allowances, deductions, salaryExpenseAccountId, payrollPayableAccountId, isActive } = req.body;

      const existing = await prisma.payrollStructure.findFirst({
        where: { id: id as string, tenantId: req.tenantId! },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Payroll structure not found.' });
      }
      const structure = await prisma.payrollStructure.update({
        where: { id: id as string },
        data: {
          baseSalary: baseSalary !== undefined ? String(baseSalary) as any : undefined,
          allowances: allowances !== undefined ? String(allowances) as any : undefined,
          deductions: deductions !== undefined ? String(deductions) as any : undefined,
          salaryExpenseAccountId,
          payrollPayableAccountId,
          isActive
        }
      });
      res.status(200).json({ status: 'success', data: structure });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Reimbursements (GL Double-Entry Voucher Integration)
  // =========================================================

  static async getReimbursementRequests(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isFin = isAuthorizedForHRCompensation(req);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isFin && memberId ? { memberId } : {})
      };
      const [total, requests] = await Promise.all([
        prisma.reimbursementRequest.count({ where }),
        prisma.reimbursementRequest.findMany({
          where,
          include: {
            member: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: requests, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createReimbursementRequest(req: TenantRequest, res: Response) {
    try {
      const { amount, category, description, receiptUrl, memberId } = req.body;
      if (!amount || !category) return res.status(400).json({ error: 'amount and category are required.' });

      const userMemberId = await getUserMemberId(req.user?.id!);
      const targetMemberId = memberId || userMemberId;
      if (!targetMemberId) {
        return res.status(400).json({ error: 'Could not associate request with a member.' });
      }

      if (targetMemberId !== userMemberId && !isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Denied: Cannot file expenses for others.' });
      }

      const request = await prisma.reimbursementRequest.create({
        data: {
          tenantId: req.tenantId!,
          memberId: targetMemberId,
          amount: String(amount) as any,
          category,
          description,
          receiptUrl
        }
      });

      res.status(201).json({ status: 'success', data: request });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async approveReimbursementRequest(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRCompensation(req)) {
        return res.status(403).json({ error: 'Access Restricted: Finance approval needed.' });
      }
      const { id } = req.params;
      const { expenseAccountId, pettyCashAccountId, fundId, costCenterId } = req.body;

      const request = await prisma.reimbursementRequest.findFirst({
        where: { id: id as string, tenantId: req.tenantId! }
      });
      if (!request) {
        return res.status(404).json({ error: 'Reimbursement request not found.' });
      }

      if (request.status === 'Approved' || request.status === 'Paid') {
        return res.status(400).json({ error: 'Reimbursement has already been approved/paid.' });
      }

      // Standard double entry account routing
      let expenseAccId = expenseAccountId;
      let pettyCashAccId = pettyCashAccountId;

      if (!expenseAccId || !pettyCashAccId) {
        const cashAcc = await prisma.account.findFirst({
          where: { tenantId: req.tenantId!, code: '1010' }
        });
        const expAcc = await prisma.account.findFirst({
          where: { tenantId: req.tenantId!, code: '4010' }
        });
        expenseAccId = expenseAccId || expAcc?.id;
        pettyCashAccId = pettyCashAccId || cashAcc?.id;
      }

      if (!expenseAccId || !pettyCashAccId) {
        return res.status(400).json({ error: 'Standard cash or expense accounts could not be automatically resolved.' });
      }

      const requestMember = await prisma.member.findUnique({
        where: { id: request.memberId },
        select: { name: true }
      });
      const memberName = requestMember?.name || 'Staff Member';

      // Generate a strict double-entry Petty Cash voucher posting
      const voucher = await AccountingService.createPettyCashReimbursement(
        req.tenantId!,
        {
          amount: Number(request.amount),
          expenseAccountId: expenseAccId,
          pettyCashAccountId: pettyCashAccId,
          fundId,
          costCenterId,
          description: `Staff Expense Reimbursement: ${memberName} (${request.category})`,
          reference: `REIMB-${request.id.slice(0,8)}`
        },
        {
          approvedByUserId: req.user?.id || null,
          postedByUserId: req.user?.id || null
        }
      );

      // Save state and Voucher reference
      const updated = await prisma.reimbursementRequest.update({
        where: { id: id as string },
        data: {
          status: 'Paid',
          voucherId: voucher.id,
          approvedByUserId: req.user?.id
        }
      });

      res.status(200).json({ status: 'success', data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Staff Confidential Documents (Confidentiality Rules)
  // =========================================================

  static async getStaffDocuments(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isManager && memberId ? { memberId } : {})
      };
      const [total, docs] = await Promise.all([
        prisma.staffDocument.count({ where }),
        prisma.staffDocument.findMany({
          where,
          include: {
            member: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: docs, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createStaffDocument(req: TenantRequest, res: Response) {
    try {
      const { memberId, title, category, notes } = req.body;
      if (!title || !category) return res.status(400).json({ error: 'title and category are required.' });

      const userMemberId = await getUserMemberId(req.user?.id!);
      const targetMemberId = memberId || userMemberId;
      if (!targetMemberId) {
        return res.status(400).json({ error: 'Could not associate document with a member.' });
      }

      if (targetMemberId !== userMemberId && !isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Unauthorized contract upload.' });
      }

      let fileUrl = '';
      const file = (req as any).file as Express.Multer.File | undefined;
      if (file) {
        const ext = file.originalname.split('.').pop()?.toLowerCase() ?? 'pdf';
        const objectName = `staff/${req.tenantId}/${targetMemberId}/docs/${category}-${randomUUID()}.${ext}`;
        fileUrl = await storeFile(file, objectName);
      } else if (req.body.fileUrl) {
        fileUrl = String(req.body.fileUrl);
      } else {
        return res.status(400).json({ error: 'file or fileUrl is required.' });
      }

      const doc = await prisma.staffDocument.create({
        data: {
          tenantId: req.tenantId!,
          memberId: targetMemberId,
          title,
          category,
          fileUrl,
          notes,
          uploadedBy: req.user?.id
        }
      });
      res.status(201).json({ status: 'success', data: doc });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async deleteStaffDocument(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { id } = req.params;
      const existing = await prisma.staffDocument.findFirst({
        where: { id: id as string, tenantId: req.tenantId! },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Staff document not found.' });
      }
      await prisma.staffDocument.delete({ where: { id: id as string } });
      res.status(200).json({ status: 'success', message: 'Staff document deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Performance Reviews
  // =========================================================

  static async getPerformanceReviews(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isManager && memberId ? { OR: [{ revieweeId: memberId }, { reviewerId: memberId }] } : {})
      };
      const [total, reviews] = await Promise.all([
        prisma.performanceReview.count({ where }),
        prisma.performanceReview.findMany({
          where,
          include: {
            reviewee: { select: { name: true, department: true } },
            reviewer: { select: { name: true } }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: reviews, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createPerformanceReview(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { revieweeId, rating, feedback, goals, status } = req.body;
      const userMemberId = await getUserMemberId(req.user?.id!);
      if (!revieweeId || !userMemberId) {
        return res.status(400).json({ error: 'revieweeId and authorized reviewer are required.' });
      }

      const review = await prisma.performanceReview.create({
        data: {
          tenantId: req.tenantId!,
          revieweeId,
          reviewerId: userMemberId,
          rating: rating ? Number(rating) : null,
          feedback,
          goals,
          status: status || 'Draft'
        }
      });
      res.status(201).json({ status: 'success', data: review });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async patchPerformanceReview(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { rating, feedback, goals, status } = req.body;

      const existing = await prisma.performanceReview.findUnique({ where: { id: id as string } });
      if (!existing || existing.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Review not found.' });
      }

      const userMemberId = await getUserMemberId(req.user?.id!);
      if (existing.reviewerId !== userMemberId && !isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Only reviewer or HR manager can edit.' });
      }

      const review = await prisma.performanceReview.update({
        where: { id: id as string },
        data: {
          rating: rating !== undefined ? Number(rating) : undefined,
          feedback,
          goals,
          status
        }
      });
      res.status(200).json({ status: 'success', data: review });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Training Records
  // =========================================================

  static async getTrainingRecords(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isManager && memberId ? { memberId } : {})
      };
      const [total, records] = await Promise.all([
        prisma.trainingRecord.count({ where }),
        prisma.trainingRecord.findMany({
          where,
          include: {
            member: { select: { name: true } }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: records, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createTrainingRecord(req: TenantRequest, res: Response) {
    try {
      const { memberId, courseName, provider, completionDate, certificationNo, status, notes } = req.body;
      if (!courseName) return res.status(400).json({ error: 'courseName is required.' });

      const userMemberId = await getUserMemberId(req.user?.id!);
      const targetMemberId = memberId || userMemberId;
      if (!targetMemberId) {
        return res.status(400).json({ error: 'Could not resolve member ID.' });
      }

      if (targetMemberId !== userMemberId && !isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }

      const record = await prisma.trainingRecord.create({
        data: {
          tenantId: req.tenantId!,
          memberId: targetMemberId,
          courseName,
          provider,
          completionDate: completionDate ? new Date(completionDate) : null,
          certificationNo,
          status: status || 'Completed',
          notes
        }
      });
      res.status(201).json({ status: 'success', data: record });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Recruitment Pipeline
  // =========================================================

  static async getRecruitmentPipeline(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied: Requires Admin/HR rights.' });
      }
      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = { tenantId: req.tenantId! };
      const [total, candidates] = await Promise.all([
        prisma.recruitmentPipeline.count({ where }),
        prisma.recruitmentPipeline.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: candidates, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createRecruitmentPipeline(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { candidateName, email, phone, appliedRole, stage, resumeUrl, notes } = req.body;
      if (!candidateName || !email || !appliedRole) {
        return res.status(400).json({ error: 'candidateName, email, and appliedRole are required.' });
      }

      const candidate = await prisma.recruitmentPipeline.create({
        data: {
          tenantId: req.tenantId!,
          candidateName,
          email,
          phone,
          appliedRole,
          stage: stage || 'Applied',
          resumeUrl,
          notes
        }
      });
      res.status(201).json({ status: 'success', data: candidate });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async patchRecruitmentPipeline(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { id } = req.params;
      const { stage, notes } = req.body;

      const existing = await prisma.recruitmentPipeline.findFirst({
        where: { id: id as string, tenantId: req.tenantId! },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Candidate not found.' });
      }
      const candidate = await prisma.recruitmentPipeline.update({
        where: { id: id as string },
        data: { stage, notes }
      });
      res.status(200).json({ status: 'success', data: candidate });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // =========================================================
  // Onboarding Tasks
  // =========================================================

  static async getOnboardingTasks(req: TenantRequest, res: Response) {
    try {
      const memberId = await getUserMemberId(req.user?.id!);
      const isManager = isAuthorizedForHRManager(req);

      const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
      const where = {
        tenantId: req.tenantId!,
        ...(!isManager && memberId ? { memberId } : {})
      };
      const [total, tasks] = await Promise.all([
        prisma.onboardingTask.count({ where }),
        prisma.onboardingTask.findMany({
          where,
          include: {
            member: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize,
        }),
      ]);
      res.status(200).json({ status: 'success', data: tasks, meta: { page, pageSize, total } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async createOnboardingTask(req: TenantRequest, res: Response) {
    try {
      if (!isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
      const { memberId, taskName, dueDate, notes } = req.body;
      if (!memberId || !taskName) return res.status(400).json({ error: 'memberId and taskName are required.' });

      const task = await prisma.onboardingTask.create({
        data: {
          tenantId: req.tenantId!,
          memberId,
          taskName,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes
        }
      });
      res.status(201).json({ status: 'success', data: task });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async patchOnboardingTask(req: TenantRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isCompleted, notes } = req.body;

      const existing = await prisma.onboardingTask.findUnique({ where: { id: id as string } });
      if (!existing || existing.tenantId !== req.tenantId) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const userMemberId = await getUserMemberId(req.user?.id!);
      if (existing.memberId !== userMemberId && !isAuthorizedForHRManager(req)) {
        return res.status(403).json({ error: 'Access Denied' });
      }

      const task = await prisma.onboardingTask.update({
        where: { id: id as string },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
          notes
        }
      });
      res.status(200).json({ status: 'success', data: task });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
