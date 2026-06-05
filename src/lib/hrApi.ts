import { apiRequest, parseApiResponse } from '@/lib/apiClient';

export type HrSettings = {
  leaveDefaults: Record<string, number>;
  leaveTypeLabels?: Record<string, string>;
  policies?: Record<string, unknown>;
};

export type LeaveConflictReport = {
  hasConflict: boolean;
  conflicts: Array<{
    kind: string;
    severity: string;
    name: string;
    message: string;
    assignedRole: string;
  }>;
  warnings: string[];
};

export async function fetchHrCommandCenter() {
  const res = await apiRequest<unknown>('hr/command-center');
  return parseApiResponse<any>(res);
}

export async function fetchHrSettings() {
  const res = await apiRequest<unknown>('hr/settings');
  return parseApiResponse<HrSettings>(res);
}

export async function saveHrSettings(payload: Partial<HrSettings>) {
  const res = await apiRequest<unknown>('hr/settings', {
    method: 'POST',
    body: payload,
  });
  return parseApiResponse<HrSettings>(res);
}

export async function fetchLeaveRequests() {
  const res = await apiRequest<unknown>('hr/leave-requests');
  return parseApiResponse<any[]>(res) || [];
}

export async function fetchLeaveConflicts(memberId: string, startDate: string, endDate: string) {
  const q = new URLSearchParams({ memberId, startDate, endDate });
  const res = await apiRequest<unknown>(`hr/leave-requests/conflicts?${q}`);
  return parseApiResponse<LeaveConflictReport>(res);
}

export async function createLeaveRequest(body: Record<string, unknown>) {
  const res = await apiRequest<unknown>('hr/leave-requests', { method: 'POST', body });
  return parseApiResponse<any>(res);
}

export async function patchLeaveRequest(id: string, body: Record<string, unknown>) {
  const res = await apiRequest<unknown>(`hr/leave-requests/${id}`, { method: 'PATCH', body });
  return parseApiResponse<any>(res);
}

export async function fetchEmploymentProfiles() {
  const res = await apiRequest<unknown>('hr/employment-profiles');
  return parseApiResponse<any[]>(res) || [];
}

export async function createEmploymentProfile(body: Record<string, unknown>) {
  const res = await apiRequest<unknown>('hr/employment-profiles', { method: 'POST', body });
  return parseApiResponse<any>(res);
}

export async function fetchLeaveBalances(memberId?: string) {
  const q = memberId ? `?memberId=${memberId}` : '';
  const res = await apiRequest<unknown>(`hr/leave-balances${q}`);
  return parseApiResponse<any[]>(res) || [];
}

export async function fetchPayrollStructures() {
  const res = await apiRequest<unknown>('hr/payroll-structures');
  return parseApiResponse<any[]>(res) || [];
}

export async function fetchReimbursements() {
  const res = await apiRequest<unknown>('hr/reimbursements');
  return parseApiResponse<any[]>(res) || [];
}

export async function createReimbursement(body: Record<string, unknown>) {
  const res = await apiRequest<unknown>('hr/reimbursements', { method: 'POST', body });
  return parseApiResponse<any>(res);
}

export async function approveReimbursement(id: string, body?: Record<string, unknown>) {
  const res = await apiRequest<unknown>(`hr/reimbursements/${id}/approve`, { method: 'PATCH', body });
  return parseApiResponse<any>(res);
}

export async function generatePayrollRun(periodYear: number, periodMonth: number) {
  const res = await apiRequest<unknown>('hr/payroll/runs/generate', {
    method: 'POST',
    body: { periodYear, periodMonth },
  });
  return parseApiResponse<any>(res);
}
