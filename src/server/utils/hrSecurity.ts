import type { TenantRequest } from '../middleware/tenant.middleware.js';

const COMPENSATION_ROLES = new Set([
  'ADMIN',
  'HR_ADMIN',
  'FINANCE_ADMIN',
  'SUPER_ADMIN',
  'EXECUTIVE_PASTOR',
]);

const MANAGER_ROLES = new Set([
  ...COMPENSATION_ROLES,
  'CAMPUS_ADMIN',
]);

function normalizeRole(role?: string): string {
  return role?.toUpperCase()?.replace(/\s/g, '_') ?? '';
}

/** Salary, payroll structures, reimbursement approval, payslip-level data. */
export function isAuthorizedForHRCompensation(req: TenantRequest): boolean {
  if (!req.user) return false;
  if (COMPENSATION_ROLES.has(normalizeRole(req.user.role))) return true;
  const permissions = req.user.permissions ?? [];
  return permissions.includes('manage_finance') || permissions.includes('manage_hr');
}

/** HR operations: leave approval, employment profiles, staff documents (manager). */
export function isAuthorizedForHRManager(req: TenantRequest): boolean {
  if (!req.user) return false;
  if (MANAGER_ROLES.has(normalizeRole(req.user.role))) return true;
  const permissions = req.user.permissions ?? [];
  return permissions.includes('manage_hr') || permissions.includes('manage_members');
}

export function maskPayrollStructure<T extends Record<string, unknown>>(row: T): T {
  return {
    ...row,
    baseSalary: '***',
    allowances: '***',
    deductions: '***',
  };
}
