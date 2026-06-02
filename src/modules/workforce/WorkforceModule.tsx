import * as React from 'react';
import {
  Briefcase, Users, Layers, Calendar, DollarSign, Receipt,
  ClipboardList, GraduationCap, User, Search, Plus, ChevronRight,
  Mail, Phone, Building2, Star, UserCheck, RefreshCw, ArrowLeft,
  Shield, Edit3, X, Save, AlertTriangle, FileText, CheckSquare,
  TrendingUp, Download, Eye, Settings, FileBox, AlertCircle, PlayCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, SectionCard, EmptyState, PageLayout, ActionButton } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { useAuth, usePermissions } from '@/context/AuthContext';
import { buildMemberProfilePath } from '@/lib/adminNavigation';

export type HrWorkspaceTab =
  | 'dashboard'
  | 'directory'
  | 'hierarchy'
  | 'leaves'
  | 'payroll'
  | 'reimbursements'
  | 'pipeline'
  | 'performance'
  | 'self_service';

const HR_WORKSPACE_TABS: HrWorkspaceTab[] = [
  'dashboard',
  'directory',
  'hierarchy',
  'leaves',
  'payroll',
  'reimbursements',
  'pipeline',
  'performance',
  'self_service',
];

const UCOS_HR_ACTIVE_TAB = 'ucos_hr_active_tab';

function resolveHrTab(initialTab?: HrWorkspaceTab): HrWorkspaceTab {
  if (initialTab && HR_WORKSPACE_TABS.includes(initialTab)) return initialTab;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(UCOS_HR_ACTIVE_TAB);
    if (stored && HR_WORKSPACE_TABS.includes(stored as HrWorkspaceTab)) {
      sessionStorage.removeItem(UCOS_HR_ACTIVE_TAB);
      return stored as HrWorkspaceTab;
    }
  }
  return 'dashboard';
}

interface WorkforceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
  initialTab?: HrWorkspaceTab;
}

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

interface EmploymentProfile {
  id: string;
  memberId: string;
  startDate?: string;
  endDate?: string | null;
  status: string;
  jobTitle?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
  member: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    department?: string | null;
    growthStage?: string;
  };
}

interface LeaveRequest {
  id: string;
  memberId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  approvedByUserId?: string | null;
  conflictSnapshot?: { hasConflict?: boolean; conflicts?: unknown[] } | null;
  createdAt: string;
  member: {
    name: string;
    email?: string | null;
    department?: string | null;
  };
}

function leaveHasConflict(req: LeaveRequest): boolean {
  const snap = req.conflictSnapshot;
  if (snap && typeof snap === 'object') {
    if (snap.hasConflict === true) return true;
    if (Array.isArray(snap.conflicts) && snap.conflicts.length > 0) return true;
  }
  return Boolean(req.notes?.includes('[Conflict Warning]'));
}

interface LeaveBalance {
  id: string;
  memberId: string;
  leaveType: string;
  year: number;
  allocated: number;
  used: number;
  member: {
    name: string;
  };
}

interface PayrollStructure {
  id: string;
  memberId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  salaryExpenseAccountId: string;
  payrollPayableAccountId: string;
  isActive: boolean;
  member: {
    name: string;
    email?: string | null;
    department?: string | null;
  };
}

interface ReimbursementRequest {
  id: string;
  memberId: string;
  amount: number;
  category: string;
  description?: string | null;
  status: string;
  receiptUrl?: string | null;
  voucherId?: string | null;
  createdAt: string;
  member: {
    name: string;
    email?: string | null;
  };
}

interface StaffDocument {
  id: string;
  memberId: string;
  title: string;
  category: string;
  fileUrl: string;
  notes?: string | null;
  createdAt: string;
  member: {
    name: string;
  };
}

interface PerformanceReview {
  id: string;
  revieweeId: string;
  reviewerId: string;
  rating?: number | null;
  feedback?: string | null;
  goals?: string | null;
  status: string;
  createdAt: string;
  reviewee: {
    name: string;
    department?: string | null;
  };
  reviewer: {
    name: string;
  };
}

interface TrainingRecord {
  id: string;
  memberId: string;
  courseName: string;
  provider?: string | null;
  completionDate?: string | null;
  certificationNo?: string | null;
  status: string;
  notes?: string | null;
  member: {
    name: string;
  };
}

interface RecruitmentPipeline {
  id: string;
  candidateName: string;
  email: string;
  phone?: string | null;
  appliedRole: string;
  stage: string;
  resumeUrl?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface OnboardingTask {
  id: string;
  memberId: string;
  taskName: string;
  dueDate?: string | null;
  isCompleted: boolean;
  completedAt?: string | null;
  notes?: string | null;
  member: {
    name: string;
  };
}

export function WorkforceModule({ onModuleChange, initialTab }: WorkforceModuleProps) {
  const { user } = useAuth();
  const { has } = usePermissions();

  /** Leave approval + team visibility (pastors, campus leaders, HR). */
  const isLeaveApprover = React.useMemo(() => {
    if (!user) return false;
    const r = user.role?.toUpperCase()?.replace(/\s/g, '_');
    return ['ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN', 'EXECUTIVE_PASTOR', 'CAMPUS_ADMIN'].includes(r) ||
           user.permissions?.includes('manage_hr') ||
           user.permissions?.includes('manage_members');
  }, [user]);

  /** Policies, onboarding pipeline, recruitment — HR admin only. */
  const isHrAdmin = React.useMemo(() => {
    if (!user) return false;
    const r = user.role?.toUpperCase()?.replace(/\s/g, '_');
    return ['ADMIN', 'HR_ADMIN', 'SUPER_ADMIN'].includes(r) ||
           user.permissions?.includes('manage_hr');
  }, [user]);

  const isFinanceManager = React.useMemo(() => {
    if (!user) return false;
    const r = user.role?.toUpperCase()?.replace(/\s/g, '_');
    return ['ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN'].includes(r) ||
           user.permissions?.includes('manage_finance');
  }, [user]);

  const canViewCompensation = isFinanceManager || user?.permissions?.includes('manage_hr');

  const [activeTab, setActiveTab] = React.useState<HrWorkspaceTab>(() => resolveHrTab(initialTab));

  React.useEffect(() => {
    if (initialTab && HR_WORKSPACE_TABS.includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [hrCommandStats, setHrCommandStats] = React.useState<{
    pendingLeave: number;
    pendingReimbursements: number;
    openOnboarding: number;
    activeStaff: number;
  } | null>(null);

  // --- STATE LISTS ---
  const [profiles, setProfiles] = React.useState<EmploymentProfile[]>([]);
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = React.useState<LeaveBalance[]>([]);
  const [payrollStructures, setPayrollStructures] = React.useState<PayrollStructure[]>([]);
  const [reimbursements, setReimbursements] = React.useState<ReimbursementRequest[]>([]);
  const [documents, setDocuments] = React.useState<StaffDocument[]>([]);
  const [reviews, setReviews] = React.useState<PerformanceReview[]>([]);
  const [training, setTraining] = React.useState<TrainingRecord[]>([]);
  const [pipeline, setPipeline] = React.useState<RecruitmentPipeline[]>([]);
  const [onboarding, setOnboarding] = React.useState<OnboardingTask[]>([]);
  const [leaveDefaults, setLeaveDefaults] = React.useState<Record<string, number>>({
    Annual: 15, Sick: 10, Spiritual: 5
  });

  const [loading, setLoading] = React.useState(true);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // --- INTERACTION / DIALOG STATES ---
  const [selectedProfile, setSelectedProfile] = React.useState<EmploymentProfile | null>(null);
  const [selectedCandidate, setSelectedCandidate] = React.useState<RecruitmentPipeline | null>(null);
  const [conflictWarning, setConflictWarning] = React.useState<any[] | null>(null);
  const [conflictChecking, setConflictChecking] = React.useState(false);

  // Form inputs
  const [leaveForm, setLeaveForm] = React.useState({
    memberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '', notes: ''
  });
  const [profileForm, setProfileForm] = React.useState({
    memberId: '', jobTitle: '', startDate: '', status: 'Active', emergencyContact: '', notes: ''
  });
  const [payrollForm, setPayrollForm] = React.useState({
    memberId: '', baseSalary: '', allowances: '0', deductions: '0', salaryExpenseAccountId: '4010', payrollPayableAccountId: '2020', isActive: true
  });
  const [reimburseForm, setReimburseForm] = React.useState({
    amount: '', category: 'Ministry', description: '', receiptUrl: ''
  });
  const [reviewForm, setReviewForm] = React.useState({
    revieweeId: '', rating: '5', feedback: '', goals: ''
  });
  const [candidateForm, setCandidateForm] = React.useState({
    candidateName: '', email: '', phone: '', appliedRole: '', notes: ''
  });
  const [onboardForm, setOnboardForm] = React.useState({
    memberId: '', taskName: '', dueDate: '', notes: ''
  });
  const [trainForm, setTrainForm] = React.useState({
    memberId: '', courseName: '', provider: '', completionDate: '', certificationNo: '', status: 'Completed', notes: ''
  });
  const [policyForm, setPolicyForm] = React.useState({
    Annual: 15, Sick: 10, Spiritual: 5
  });

  // Modal triggers
  const [showAddProfileModal, setShowAddProfileModal] = React.useState(false);
  const [showAddLeaveModal, setShowAddLeaveModal] = React.useState(false);
  const [showPayrollModal, setShowPayrollModal] = React.useState(false);
  const [showReimburseModal, setShowReimburseModal] = React.useState(false);
  const [showCandidateModal, setShowCandidateModal] = React.useState(false);
  const [showOnboardModal, setShowOnboardModal] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showTrainingModal, setShowTrainingModal] = React.useState(false);
  const [showPolicyModal, setShowPolicyModal] = React.useState(false);

  // Members list (all workspace members for select inputs)
  const [workspaceMembers, setWorkspaceMembers] = React.useState<any[]>([]);

  const loadEmploymentProfiles = React.useCallback(async () => {
    const profsRes = await apiRequest('hr/employment-profiles?page=1&pageSize=25');
    setProfiles(parseApiResponse<EmploymentProfile[]>(profsRes) || []);
  }, []);

  const loadLeaveRequests = React.useCallback(async () => {
    const leavesRes = await apiRequest('hr/leave-requests?page=1&pageSize=25');
    setLeaveRequests(parseApiResponse<LeaveRequest[]>(leavesRes) || []);
  }, []);

  const loadLeaveBalances = React.useCallback(async () => {
    const balRes = await apiRequest('hr/leave-balances?page=1&pageSize=25');
    setLeaveBalances(parseApiResponse<LeaveBalance[]>(balRes) || []);
  }, []);

  const loadDocuments = React.useCallback(async () => {
    const docsRes = await apiRequest('hr/documents?page=1&pageSize=25');
    setDocuments(parseApiResponse<StaffDocument[]>(docsRes) || []);
  }, []);

  const loadOnboarding = React.useCallback(async () => {
    const onboardRes = await apiRequest('hr/onboarding?page=1&pageSize=25');
    setOnboarding(parseApiResponse<OnboardingTask[]>(onboardRes) || []);
  }, []);

  const loadPipeline = React.useCallback(async () => {
    if (!isHrAdmin) {
      setPipeline([]);
      return;
    }
    const pipelineRes = await apiRequest('hr/recruitment?page=1&pageSize=25');
    setPipeline(parseApiResponse<RecruitmentPipeline[]>(pipelineRes) || []);
  }, [isHrAdmin]);

  const loadReviews = React.useCallback(async () => {
    if (!isHrAdmin) {
      setReviews([]);
      return;
    }
    const reviewRes = await apiRequest('hr/performance?page=1&pageSize=25');
    setReviews(parseApiResponse<PerformanceReview[]>(reviewRes) || []);
  }, [isHrAdmin]);

  const loadTraining = React.useCallback(async () => {
    const trainRes = await apiRequest('hr/training?page=1&pageSize=25');
    setTraining(parseApiResponse<TrainingRecord[]>(trainRes) || []);
  }, []);

  const loadReimbursements = React.useCallback(async () => {
    const reimbRes = await apiRequest('hr/reimbursements?page=1&pageSize=25');
    setReimbursements(parseApiResponse<ReimbursementRequest[]>(reimbRes) || []);
  }, []);

  const loadPayrollStructures = React.useCallback(async () => {
    if (!isFinanceManager) return;
    const payRes = await apiRequest('hr/payroll-structures?page=1&pageSize=25');
    setPayrollStructures(parseApiResponse<PayrollStructure[]>(payRes) || []);
  }, [isFinanceManager]);

  // ----------------------------------------------------------------------
  // Data Fetching
  // ----------------------------------------------------------------------
  const loadAllHRData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch configurable defaults
      const settingsRes = await apiRequest('hr/settings');
      const settingsData = parseApiResponse<{ leaveDefaults?: Record<string, number>; defaults?: Record<string, number> }>(settingsRes);
      const defs = settingsData?.leaveDefaults ?? settingsData?.defaults;
      if (defs) {
        setLeaveDefaults(defs);
        setPolicyForm(defs as typeof policyForm);
      }

      const ccRes = await apiRequest('hr/command-center');
      const cc = parseApiResponse<{
        counts?: {
          pendingLeave?: number;
          pendingReimbursements?: number;
          openOnboarding?: number;
          activeStaff?: number;
        };
      }>(ccRes);
      if (cc?.counts) {
        setHrCommandStats({
          pendingLeave: cc.counts.pendingLeave ?? 0,
          pendingReimbursements: cc.counts.pendingReimbursements ?? 0,
          openOnboarding: cc.counts.openOnboarding ?? 0,
          activeStaff: cc.counts.activeStaff ?? 0,
        });
      }

      await Promise.all([
        loadEmploymentProfiles(),
        loadLeaveRequests(),
        loadLeaveBalances(),
        loadDocuments(),
        loadOnboarding(),
        loadPipeline(),
        loadReviews(),
        loadTraining(),
        loadReimbursements(),
        loadPayrollStructures(),
      ]);

      // 10. Fetch general members list for selects
      const membersRes = await apiRequest('members');
      const mList = parseApiResponse<any[]>(membersRes) || [];
      setWorkspaceMembers(mList);

    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Could not load staff desk overview');
    } finally {
      setLoading(false);
    }
  }, [
    loadDocuments,
    loadEmploymentProfiles,
    loadLeaveBalances,
    loadLeaveRequests,
    loadOnboarding,
    loadPayrollStructures,
    loadPipeline,
    loadReimbursements,
    loadReviews,
    loadTraining,
  ]);

  React.useEffect(() => {
    loadAllHRData();
  }, [loadAllHRData]);

  // ----------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------

  // A. Create/Update Profile
  const handleCreateProfile = async () => {
    if (!profileForm.memberId || !profileForm.jobTitle) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/employment-profiles', {
        method: 'POST',
        body: profileForm
      });
      setShowAddProfileModal(false);
      setProfileForm({ memberId: '', jobTitle: '', startDate: '', status: 'Active', emergencyContact: '', notes: '' });
      await loadEmploymentProfiles();
    } catch (e: any) {
      alert(e?.message || 'Error creating profile');
    } finally {
      setActionLoading(false);
    }
  };

  // B. Leave Request Conflict Live Scanner
  const checkConflictsLive = async (memberId: string, start: string, end: string) => {
    if (!memberId || !start || !end) return;
    try {
      setConflictChecking(true);
      const res = await apiRequest(`hr/leave-requests/conflicts?memberId=${memberId}&startDate=${start}&endDate=${end}`);
      const info = parseApiResponse<{ hasConflict: boolean; conflicts: any[] }>(res);
      setConflictWarning(info?.conflicts || []);
    } catch (e) {
      setConflictWarning([]);
    } finally {
      setConflictChecking(false);
    }
  };

  React.useEffect(() => {
    if (leaveForm.memberId && leaveForm.startDate && leaveForm.endDate) {
      checkConflictsLive(leaveForm.memberId, leaveForm.startDate, leaveForm.endDate);
    }
  }, [leaveForm.memberId, leaveForm.startDate, leaveForm.endDate]);

  // C. Submit Leave Request
  const handleSubmitLeave = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/leave-requests', {
        method: 'POST',
        body: {
          ...leaveForm,
          memberId: leaveForm.memberId || undefined // empty indicates self
        }
      });
      setShowAddLeaveModal(false);
      setLeaveForm({ memberId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '', notes: '' });
      setConflictWarning(null);
      await loadLeaveRequests();
    } catch (e: any) {
      alert(e?.message || 'Error submitting leave request');
    } finally {
      setActionLoading(false);
    }
  };

  // D. Approve / Reject Leave Request
  const handleApproveLeave = async (id: string, approve: boolean, forceApprove = false) => {
    try {
      setActionLoading(true);
      await apiRequest(`hr/leave-requests/${id}`, {
        method: 'PATCH',
        body: {
          status: approve ? 'Approved' : 'Rejected',
          notes: approve ? 'Approved by HR desk' : 'Rejected by HR desk',
          forceApprove: approve ? forceApprove : undefined,
        }
      });
      await loadLeaveRequests();
    } catch (e: any) {
      if (approve && e?.status === 409 && !forceApprove) {
        const ok = window.confirm(
          'Ministry staffing conflicts were detected for these dates. Approve leave anyway and accept the coverage gap?',
        );
        if (ok) return handleApproveLeave(id, true, true);
      }
      alert(e?.message || 'Error processing request');
    } finally {
      setActionLoading(false);
    }
  };

  // E. Setup Payroll Structure
  const handleSavePayroll = async () => {
    if (!payrollForm.memberId || !payrollForm.baseSalary) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/payroll-structures', {
        method: 'POST',
        body: payrollForm
      });
      setShowPayrollModal(false);
      setPayrollForm({ memberId: '', baseSalary: '', allowances: '0', deductions: '0', salaryExpenseAccountId: '4010', payrollPayableAccountId: '2020', isActive: true });
      await loadPayrollStructures();
    } catch (e: any) {
      alert(e?.message || 'Error setting up compensation model');
    } finally {
      setActionLoading(false);
    }
  };

  // F. File Reimbursement Request
  const handleFileReimburse = async () => {
    if (!reimburseForm.amount || !reimburseForm.category) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/reimbursements', {
        method: 'POST',
        body: reimburseForm
      });
      setShowReimburseModal(false);
      setReimburseForm({ amount: '', category: 'Ministry', description: '', receiptUrl: '' });
      await loadReimbursements();
    } catch (e: any) {
      alert(e?.message || 'Error filing expense claim');
    } finally {
      setActionLoading(false);
    }
  };

  // G. Approve Petty Cash Reimbursement -> Ledger Linkage
  const handleApproveReimburse = async (id: string) => {
    try {
      setActionLoading(true);
      await apiRequest(`hr/reimbursements/${id}/approve`, {
        method: 'PATCH',
        body: {
          expenseAccountId: '4010', // Default Pastoral/Staff salary/expense
          pettyCashAccountId: '1010' // Default cash
        }
      });
      await loadReimbursements();
    } catch (e: any) {
      alert(e?.message || 'Error posting payment voucher');
    } finally {
      setActionLoading(false);
    }
  };

  // H. Onboard Checklist Task Addition
  const handleAddOnboardTask = async () => {
    if (!onboardForm.memberId || !onboardForm.taskName) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/onboarding', {
        method: 'POST',
        body: onboardForm
      });
      setShowOnboardModal(false);
      setOnboardForm({ memberId: '', taskName: '', dueDate: '', notes: '' });
      await loadOnboarding();
    } catch (e: any) {
      alert(e?.message || 'Error creating orientation task');
    } finally {
      setActionLoading(false);
    }
  };

  // I. Complete Onboarding Task
  const handleToggleOnboardTask = async (id: string, currentStatus: boolean) => {
    try {
      setActionLoading(true);
      await apiRequest(`hr/onboarding/${id}`, {
        method: 'PATCH',
        body: { isCompleted: !currentStatus }
      });
      await loadOnboarding();
    } catch (e: any) {
      alert(e?.message || 'Error completing onboarding checklist item');
    } finally {
      setActionLoading(false);
    }
  };

  // J. Add Recruitment Pipeline Entry
  const handleAddCandidate = async () => {
    if (!candidateForm.candidateName || !candidateForm.email || !candidateForm.appliedRole) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/recruitment', {
        method: 'POST',
        body: { ...candidateForm, stage: 'Applied' }
      });
      setShowCandidateModal(false);
      setCandidateForm({ candidateName: '', email: '', phone: '', appliedRole: '', notes: '' });
      await loadPipeline();
    } catch (e: any) {
      alert(e?.message || 'Error registering candidate');
    } finally {
      setActionLoading(false);
    }
  };

  // K. Advance Recruitment Candidate Stage
  const handleAdvanceCandidate = async (id: string, stage: string) => {
    try {
      setActionLoading(true);
      await apiRequest(`hr/recruitment/${id}`, {
        method: 'PATCH',
        body: { stage }
      });
      await loadPipeline();
    } catch (e: any) {
      alert(e?.message || 'Error updating recruitment status');
    } finally {
      setActionLoading(false);
    }
  };

  // L. File Performance Review Rating
  const handleSaveReview = async () => {
    if (!reviewForm.revieweeId || !reviewForm.feedback) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/performance', {
        method: 'POST',
        body: {
          ...reviewForm,
          status: 'Submitted'
        }
      });
      setShowReviewModal(false);
      setReviewForm({ revieweeId: '', rating: '5', feedback: '', goals: '' });
      await loadReviews();
    } catch (e: any) {
      alert(e?.message || 'Error saving feedback');
    } finally {
      setActionLoading(false);
    }
  };

  // M. Log Training Course Completion
  const handleSaveTraining = async () => {
    if (!trainForm.memberId || !trainForm.courseName) return;
    try {
      setActionLoading(true);
      await apiRequest('hr/training', {
        method: 'POST',
        body: trainForm
      });
      setShowTrainingModal(false);
      setTrainForm({ memberId: '', courseName: '', provider: '', completionDate: '', certificationNo: '', status: 'Completed', notes: '' });
      await loadTraining();
    } catch (e: any) {
      alert(e?.message || 'Error recording certification');
    } finally {
      setActionLoading(false);
    }
  };

  // N. Configure Leave defaults globally
  const handleUpdatePolicy = async () => {
    try {
      setActionLoading(true);
      await apiRequest('hr/settings', {
        method: 'POST',
        body: { leaveDefaults: policyForm },
      });
      setShowPolicyModal(false);
      await loadAllHRData();
    } catch (e: any) {
      alert(e?.message || 'Error updating settings');
    } finally {
      setActionLoading(false);
    }
  };

  // O. Run Payrun Simulation (Wizard)
  const handlePostPayrollRun = async () => {
    if (payrollStructures.length === 0) {
      alert('No active payroll structures set up yet. Configure salaries first!');
      return;
    }
    const now = new Date();
    const yes = window.confirm(
      `Generate payroll for ${now.toLocaleString('default', { month: 'long', year: 'numeric' })} (${payrollStructures.length} active staff)? This creates payroll lines and balanced vouchers.`,
    );
    if (!yes) return;

    try {
      setActionLoading(true);
      await apiRequest('hr/payroll/runs/generate', {
        method: 'POST',
        body: {
          periodYear: now.getFullYear(),
          periodMonth: now.getMonth() + 1,
        },
      });
      alert('Payroll run generated successfully. Review vouchers in Finance.');
      await loadAllHRData();
    } catch (e: any) {
      alert(e?.message || 'Payroll run failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Self Service matching ID
  const myMemberId = React.useMemo(() => {
    if (!user) return null;
    const match = workspaceMembers.find(m => m.email === user.email || m.userId === user.id);
    return match?.id || null;
  }, [user, workspaceMembers]);

  // Loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm font-bold text-slate-500">Loading HR & staff…</p>
      </div>
    );
  }

  return (
    <PageLayout>
      <ModuleHeader
        title="HR & Staff"
        subtitle="Staff directory, leave, payroll, reimbursements, and onboarding — built for church teams."
        icon={Briefcase}
        actions={
          <>
            {isHrAdmin && (
              <ActionButton label="Policies" icon={Settings} variant="ghost" onClick={() => setShowPolicyModal(true)} />
            )}
            <ActionButton label="Request leave" icon={Calendar} variant="secondary" onClick={() => setShowAddLeaveModal(true)} />
            {isHrAdmin && (
              <ActionButton label="Onboard staff" icon={Plus} variant="primary" onClick={() => setShowAddProfileModal(true)} />
            )}
          </>
        }
      />

      {/* --- PREMIUM METRICS BAR --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Active staff" value={hrCommandStats?.activeStaff ?? profiles.filter(p => p.status === 'Active').length} icon={Users} iconColor="text-indigo-500" iconBg="bg-indigo-50/50" />
        <StatCard label="Pending Leave" value={hrCommandStats?.pendingLeave ?? leaveRequests.filter(r => r.status === 'Pending').length} icon={Calendar} iconColor="text-amber-500" iconBg="bg-amber-50/50" />
        <StatCard label="Pending Expenses" value={hrCommandStats?.pendingReimbursements ?? reimbursements.filter(r => r.status === 'Pending').length} icon={Receipt} iconColor="text-rose-500" iconBg="bg-rose-50/50" />
        <StatCard label="Orientation Tasks" value={hrCommandStats?.openOnboarding ?? onboarding.filter(t => !t.isCompleted).length} icon={ClipboardList} iconColor="text-violet-500" iconBg="bg-violet-50/50" />
      </div>

      {/* --- LENS TABS SYSTEM --- */}
      <div className="flex bg-slate-900/5 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/50 w-full overflow-x-auto gap-1">
        <button
          onClick={() => { setActiveTab('dashboard'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
        >
          Overview Center
        </button>
        <button
          onClick={() => { setActiveTab('directory'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'directory' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
        >
          Staff directory
        </button>
        <button
          onClick={() => { setActiveTab('hierarchy'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'hierarchy' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
        >
          Org Structure
        </button>
        <button
          onClick={() => { setActiveTab('leaves'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'leaves' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
        >
          Leave Workflows
        </button>
        {isFinanceManager && (
          <button
            onClick={() => { setActiveTab('payroll'); setSelectedProfile(null); }}
            className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'payroll' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
          >
            Payroll & Payrun
          </button>
        )}
        <button
          onClick={() => { setActiveTab('reimbursements'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'reimbursements' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
        >
          Ledger Expenses
        </button>
        {isHrAdmin && (
          <button
            onClick={() => { setActiveTab('pipeline'); setSelectedProfile(null); }}
            className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'pipeline' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
          >
            Pipeline & Onboard
          </button>
        )}
        {isHrAdmin && (
          <button
            onClick={() => { setActiveTab('performance'); setSelectedProfile(null); }}
            className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap', activeTab === 'performance' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900')}
          >
            Feedback & Reviews
          </button>
        )}
        <button
          onClick={() => { setActiveTab('self_service'); setSelectedProfile(null); }}
          className={cn('px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20')}
        >
          My Self-Service
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TABS CONTENT */}
      {/* ------------------------------------------------------------------ */}

      {/* --- TAB 1: OVERVIEW CENTER --- */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Main Console */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/80 border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-indigo-600" /> Pending leave approvals
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {leaveRequests.filter(r => r.status === 'Pending').length} awaiting decision
                {isFinanceManager ? ` · ${reimbursements.filter(r => r.status === 'Pending').length} expense claims pending` : ''}
              </p>
              
              <div className="divide-y divide-slate-100">
                {leaveRequests.filter(r => r.status === 'Pending').length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium">
                    No pending leaves. Church staff operations are fully coverage-stable.
                  </div>
                ) : (
                  leaveRequests.filter(r => r.status === 'Pending').map(req => {
                    const hasConflict = leaveHasConflict(req);
                    return (
                      <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{req.member.name}</span>
                            <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[9px] uppercase tracking-widest">{req.leaveType}</Badge>
                            {hasConflict && (
                              <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-widest flex items-center gap-0.5">
                                <AlertTriangle size={8} /> Coverage Gap
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">
                            {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-400">{req.reason || 'No reason provided'}</p>
                        </div>

                        {isLeaveApprover && (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleApproveLeave(req.id, false)}
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                            >
                              Deny
                            </Button>
                            <Button
                              onClick={() => handleApproveLeave(req.id, true)}
                              size="sm"
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                            >
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions Console */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => { setActiveTab('self_service'); }}
                className="bg-white hover:border-emerald-300 border border-slate-100 p-5 rounded-2xl text-left hover:scale-[1.02] transition-all shadow-sm space-y-2 group"
              >
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <User size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs group-hover:text-emerald-600 transition-colors">Personal Portal</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Check payslips, log certifications, submit request.</p>
              </button>

              <button
                onClick={() => { setActiveTab('leaves'); }}
                className="bg-white hover:border-indigo-300 border border-slate-100 p-5 rounded-2xl text-left hover:scale-[1.02] transition-all shadow-sm space-y-2 group"
              >
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Calendar size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">Conflict Roster Scan</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Checks event schedules before leave authorization.</p>
              </button>

              <button
                onClick={() => { setActiveTab('reimbursements'); }}
                className="bg-white hover:border-amber-300 border border-slate-100 p-5 rounded-2xl text-left hover:scale-[1.02] transition-all shadow-sm space-y-2 group"
              >
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Receipt size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-xs group-hover:text-amber-600 transition-colors">GL Petty Cash Posting</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Expense approval posts direct to general ledger.</p>
              </button>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Approved leave (next 14 days)</h3>
              <div className="space-y-2">
                {leaveRequests
                  .filter(r => {
                    if (r.status !== 'Approved') return false;
                    const start = new Date(r.startDate);
                    const horizon = new Date();
                    horizon.setDate(horizon.getDate() + 14);
                    return start <= horizon;
                  })
                  .slice(0, 5)
                  .map(r => (
                    <div key={r.id} className="p-3 bg-slate-50 rounded-xl text-xs">
                      <p className="font-bold text-slate-800">{r.member.name}</p>
                      <p className="text-slate-500 font-semibold mt-0.5">
                        {r.leaveType} · {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                {leaveRequests.filter(r => r.status === 'Approved').length === 0 && (
                  <p className="text-center text-slate-400 text-[11px] py-4">No upcoming approved leave.</p>
                )}
              </div>
            </div>

            {isHrAdmin && (
              <>
                <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4">
                  <h3 className="font-black text-sm uppercase tracking-widest text-indigo-400">Onboarding</h3>
                  <p className="text-xs text-slate-400">Outstanding orientation tasks for new staff.</p>
                  <div className="space-y-3">
                    {onboarding.filter(t => !t.isCompleted).slice(0, 4).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{task.taskName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{task.member.name}</p>
                        </div>
                        <button
                          onClick={() => handleToggleOnboardTask(task.id, task.isCompleted)}
                          className={cn('p-1 rounded-lg hover:scale-110 transition-transform', task.isCompleted ? 'text-emerald-500' : 'text-slate-400')}
                        >
                          <CheckSquare size={16} />
                        </button>
                      </div>
                    ))}
                    {onboarding.filter(t => !t.isCompleted).length === 0 && (
                      <p className="text-center text-slate-500 text-[11px] py-4">No active onboarding tasks.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm">Recruitment</h3>
                  <div className="space-y-2">
                    {pipeline.slice(0, 3).map(cand => (
                      <div key={cand.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{cand.candidateName}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{cand.appliedRole}</p>
                        </div>
                        <Badge className="bg-indigo-50 text-indigo-700 border-none text-[9px] font-black uppercase tracking-widest">{cand.stage}</Badge>
                      </div>
                    ))}
                    {pipeline.length === 0 && (
                      <p className="text-center text-slate-400 text-[11px] py-4">No active candidates.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 2: STAFF DIRECTORY --- */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff profile records by name or title..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.location.assign(buildMemberProfilePath(profile.member.id));
                    }
                  }}
                  className="text-left bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-5 group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <AppAvatar
                      name={profile.member.name}
                      className="w-12 h-12 rounded-xl shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{profile.member.name}</h3>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{profile.jobTitle || 'Staff'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[8px] uppercase tracking-widest">{profile.status}</Badge>
                        <span className="text-[10px] text-slate-400 font-semibold">{profile.member.department || 'Ministry'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                      Started: {profile.startDate ? new Date(profile.startDate).toLocaleDateString() : '—'}
                    </span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </button>
              ))}
              {profiles.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
                  No active Employment Profiles. Onboard staff above to initialize metadata.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: ORG HIERARCHY --- */}
      {activeTab === 'hierarchy' && (
        <div className="bg-white border border-slate-200/60 rounded-3xl p-8 shadow-sm space-y-8 animate-in fade-in duration-300">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Badge className="bg-indigo-100 text-indigo-700 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">Reporting Structure</Badge>
            <h2 className="text-xl font-black text-slate-800">Ministry Organization Hierarchy</h2>
            <p className="text-slate-500 text-xs font-semibold">Visualizing leadership lines from Pastoral staff down to ministry departments.</p>
          </div>

          <div className="flex flex-col items-center gap-8 py-6">
            
            {/* Top Leadership node */}
            <div className="flex flex-col items-center">
              <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-lg border border-slate-800 text-center w-56">
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Lead Pastor / Leadership</p>
                <h4 className="font-black text-sm mt-1">Leadership team</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Campus Overseer</p>
              </div>
              <div className="w-0.5 h-10 bg-slate-300" />
            </div>

            {/* Second Tier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative w-full max-w-4xl">
              {profiles.slice(0, 3).map(profile => (
                <div key={profile.id} className="flex flex-col items-center">
                  <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-xl text-center w-52 hover:border-indigo-500 transition-colors">
                    <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest">{profile.member.department || 'Ministry Area'}</p>
                    <h4 className="font-bold text-xs text-slate-800 mt-1">{profile.member.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{profile.jobTitle}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 4: LEAVE MANAGEMENT --- */}
      {activeTab === 'leaves' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-slate-800">Leave Approvals & History</h2>
              <Button
                onClick={() => setShowAddLeaveModal(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
              >
                <Plus size={12} /> Create Request
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {leaveRequests.map(req => {
                const hasConflict = leaveHasConflict(req);
                return (
                  <div key={req.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{req.member.name}</span>
                        <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[9px] uppercase tracking-widest">{req.leaveType}</Badge>
                        {hasConflict && (
                          <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-widest">
                            Roster Conflict
                          </Badge>
                        )}
                        <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest ml-2',
                          req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                          req.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {req.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold">
                        {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400">{req.reason || 'No reason provided'}</p>
                    </div>

                    {isLeaveApprover && req.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApproveLeave(req.id, false)}
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-bold"
                        >
                          Deny
                        </Button>
                        <Button
                          onClick={() => handleApproveLeave(req.id, true)}
                          size="sm"
                          className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
              {leaveRequests.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">No leave requests logged in system history.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: PAYROLL & COMPENSATION (Highly Secure) --- */}
      {activeTab === 'payroll' && isFinanceManager && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-black text-indigo-400 uppercase tracking-widest text-xs">Payroll Management Portal</h3>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Monthly Payroll Execution Wizard</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Processes and posts base salaries, allowances, and tax/deductions direct to Ledger Accounts code 4010.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setShowPayrollModal(true)}
                  className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-black uppercase tracking-widest"
                >
                  Configure Salary
                </Button>
                <Button
                  onClick={handlePostPayrollRun}
                  className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest gap-2"
                >
                  <PlayCircle size={14} /> Run Payrun Wizard
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Active Compensation Structures</h3>
            <div className="divide-y divide-slate-100">
              {payrollStructures.map(struct => (
                <div key={struct.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{struct.member.name}</span>
                    <p className="text-[11px] text-slate-400 font-semibold">{struct.member.department || 'Ministry Office'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Base</p>
                      <p className="text-xs font-bold text-slate-800">INR {Number(struct.baseSalary).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Allowances</p>
                      <p className="text-xs font-bold text-emerald-600">+{Number(struct.allowances).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Deductions</p>
                      <p className="text-xs font-bold text-rose-600">-{Number(struct.deductions).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest', struct.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {struct.isActive ? 'Active Salary' : 'Paused'}
                    </Badge>
                  </div>
                </div>
              ))}
              {payrollStructures.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">No active compensation templates defined.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: EXPENSE REIMBURSEMENTS & GL POSTINGS --- */}
      {activeTab === 'reimbursements' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800">Petty Cash Expense Reimbursements</h2>
                <p className="text-xs text-slate-500 mt-0.5">Staff claims linked directly to UCOS double-entry bookkeeping ledgers.</p>
              </div>
              <Button
                onClick={() => setShowReimburseModal(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
              >
                <Plus size={12} /> Claim Expense
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {reimbursements.map(claim => (
                <div key={claim.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{claim.member.name}</span>
                      <Badge className="bg-slate-100 text-slate-700 border-none font-black text-[9px] uppercase tracking-widest">{claim.category}</Badge>
                      <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest',
                        claim.status === 'Paid' || claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                        claim.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      )}>
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">{claim.description || 'Ministry items purchased'}</p>
                    {claim.voucherId && (
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block">
                        posted to Ledger: PV-{claim.voucherId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="font-bold text-sm text-slate-800">INR {Number(claim.amount).toLocaleString()}</span>
                    {isFinanceManager && claim.status === 'Pending' && (
                      <Button
                        onClick={() => handleApproveReimburse(claim.id)}
                        className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Approve & Post PV
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {reimbursements.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">No expense claims logged.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: PIPELINE & ONBOARDING --- */}
      {activeTab === 'pipeline' && isHrAdmin && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Recruitment pipeline board */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800">Recruitment Kanban Board</h2>
                <p className="text-xs text-slate-500 mt-0.5">Drag & drop / advance pastoral candidates through hiring stages.</p>
              </div>
              <Button
                onClick={() => setShowCandidateModal(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
              >
                <Plus size={12} /> Add Candidate
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
              {['Applied', 'Interviewing', 'Offered', 'Hired'].map(stage => {
                const list = pipeline.filter(c => c.stage === stage);
                return (
                  <div key={stage} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">{stage}</span>
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black">{list.length}</span>
                    </div>

                    <div className="space-y-2">
                      {list.map(cand => (
                        <div key={cand.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                          <p className="text-xs font-bold text-slate-800">{cand.candidateName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{cand.appliedRole}</p>
                          <div className="flex justify-end gap-1">
                            {stage !== 'Hired' && (
                              <button
                                onClick={() => handleAdvanceCandidate(cand.id, stage === 'Applied' ? 'Interviewing' : stage === 'Interviewing' ? 'Offered' : 'Hired')}
                                className="text-[9px] text-indigo-600 font-black uppercase tracking-widest hover:text-indigo-800"
                              >
                                Advance &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {list.length === 0 && (
                        <p className="text-center text-slate-300 text-[10px] py-4">Column empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Orientation checklists */}
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-black text-slate-800">Staff Onboarding Orientation Tasks</h2>
                <p className="text-xs text-slate-500 mt-0.5">Checklist tasks automatically assigned to newly onboarded workforce.</p>
              </div>
              <Button
                onClick={() => setShowOnboardModal(true)}
                className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest gap-2"
              >
                <Plus size={12} /> Assign Task
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {onboarding.map(task => (
                <div key={task.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">{task.taskName}</span>
                    <p className="text-[10px] text-slate-400 font-semibold">{task.member.name} {task.dueDate ? `| Due: ${new Date(task.dueDate).toLocaleDateString()}` : ''}</p>
                  </div>
                  <button
                    onClick={() => handleToggleOnboardTask(task.id, task.isCompleted)}
                    className={cn('flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-lg border transition-all',
                      task.isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                    )}
                  >
                    {task.isCompleted ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              ))}
              {onboarding.length === 0 && (
                <p className="text-center text-slate-400 text-xs py-8">No onboarding tasks currently assigned.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: PERFORMANCE & TRAINING --- */}
      {activeTab === 'performance' && isHrAdmin && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Reviews list */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Pastoral Feedback & Performance Reviews</h3>
                <Button
                  onClick={() => setShowReviewModal(true)}
                  className="h-8 px-3 rounded-lg bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest"
                >
                  Write Review
                </Button>
              </div>

              <div className="space-y-3">
                {reviews.map(rev => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-800">{rev.reviewee.name}</p>
                        <p className="text-[9px] text-slate-400 font-semibold">{rev.reviewee.department}</p>
                      </div>
                      <Badge className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 border-none">
                        Rating: {rev.rating}/5
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 font-medium italic mt-1">&ldquo;{rev.feedback}&rdquo;</p>
                    {rev.goals && (
                      <p className="text-[10px] text-indigo-600 font-bold mt-1">Spiritual Goals: {rev.goals}</p>
                    )}
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8">No performance reviews stored in database.</p>
                )}
              </div>
            </div>

            {/* Certifications registry */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">Staff Certifications & Training registry</h3>
                <Button
                  onClick={() => setShowTrainingModal(true)}
                  className="h-8 px-3 rounded-lg bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest"
                >
                  Add Record
                </Button>
              </div>

              <div className="divide-y divide-slate-100">
                {training.map(rec => (
                  <div key={rec.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{rec.courseName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{rec.member.name} | Completed: {rec.completionDate ? new Date(rec.completionDate).toLocaleDateString() : '—'}</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase tracking-widest">{rec.status}</Badge>
                  </div>
                ))}
                {training.length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-8">No certified training completions logged.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 9: STAFF SELF-SERVICE PORTAL --- */}
      {activeTab === 'self_service' && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {!myMemberId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-semibold">
              Your login is not linked to a member profile yet. Ask HR to match your user email to your staff record, or use Request Leave from the header (HR will assign it to you).
            </div>
          )}
          
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800/90 to-slate-900/95 text-white p-8 rounded-3xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-black">Welcome to Staff Self-Service Center</h2>
            <p className="text-xs text-slate-300 mt-1">Submit leaves, track reimbursements, and complete onboarding tasks.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <span className="text-[9px] uppercase font-black text-emerald-300">Leave Balance Available</span>
                <div className="grid grid-cols-3 gap-2 mt-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400">Annual</p>
                    <p className="text-sm font-bold">
                      {leaveBalances.find(b => b.memberId === myMemberId && b.leaveType === 'Annual')?.allocated ?? 15} days
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Sick</p>
                    <p className="text-sm font-bold">
                      {leaveBalances.find(b => b.memberId === myMemberId && b.leaveType === 'Sick')?.allocated ?? 10} days
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Spiritual</p>
                    <p className="text-sm font-bold">
                      {leaveBalances.find(b => b.memberId === myMemberId && b.leaveType === 'Spiritual')?.allocated ?? 5} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-black text-emerald-300">Active Orientations</span>
                  <p className="text-xs font-bold mt-1">
                    {onboarding.filter(t => t.memberId === myMemberId && !t.isCompleted).length} tasks remaining
                  </p>
                </div>
                {onboarding.filter(t => t.memberId === myMemberId && !t.isCompleted).length > 0 && (
                  <ul className="mt-2 space-y-1 text-[10px] text-slate-300">
                    {onboarding.filter(t => t.memberId === myMemberId && !t.isCompleted).slice(0, 3).map(t => (
                      <li key={t.id}>• {t.taskName}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-black text-emerald-300">Expense reimbursement</span>
                  <p className="text-xs font-bold mt-1">
                    INR {reimbursements.filter(r => r.memberId === myMemberId).reduce((a, b) => a + Number(b.amount), 0).toLocaleString()} claimed
                  </p>
                </div>
                <Button
                  onClick={() => setShowReimburseModal(true)}
                  className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] w-full mt-3 border-none"
                >
                  File Reimbursement
                </Button>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* My personal leave requests */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">My Leave Requests</h3>
              <div className="divide-y divide-slate-100">
                {leaveRequests.filter(r => r.memberId === myMemberId).map(req => (
                  <div key={req.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{req.leaveType} Request</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}</p>
                    </div>
                    <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest',
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                      req.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    )}>
                      {req.status}
                    </Badge>
                  </div>
                ))}
                {leaveRequests.filter(r => r.memberId === myMemberId).length === 0 && (
                  <p className="text-center text-slate-400 text-[11px] py-6">You haven't requested any leaves.</p>
                )}
              </div>
            </div>

            {/* My personal payslips — finance/HR only see amounts */}
            <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">My Payslips</h3>
              {!canViewCompensation && (
                <p className="text-[11px] text-slate-500 font-medium">Compensation amounts are visible only to Finance and HR. You can confirm a payslip exists below.</p>
              )}
              <div className="space-y-3">
                {payrollStructures.filter(s => s.memberId === myMemberId).map(s => (
                  <div key={s.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold text-slate-800">Monthly payslip</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase tracking-widest">Active</Badge>
                    </div>
                    {canViewCompensation ? (
                      <>
                        <div className="flex justify-between items-center text-xs font-semibold pt-2 border-t border-slate-200/50">
                          <span>Net payable:</span>
                          <span className="font-black text-slate-900">
                            INR {(Number(s.baseSalary) + Number(s.allowances) - Number(s.deductions)).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          onClick={() => alert('Payslip PDF export is planned for V1.5 — amounts are recorded in Finance payroll runs.')}
                          size="sm"
                          className="w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-widest gap-2 mt-2"
                        >
                          <Download size={10} /> Download PDF Payslip
                        </Button>
                      </>
                    ) : (
                      <p className="text-[11px] text-slate-500 font-semibold pt-2 border-t border-slate-200/50">
                        Net payable: <span className="font-black">***</span> (restricted)
                      </p>
                    )}
                  </div>
                ))}
                {payrollStructures.filter(s => s.memberId === myMemberId).length === 0 && (
                  <p className="text-center text-slate-400 text-[11px] py-6">No payroll structure linked to your profile yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODALS / WIZARDS */}
      {/* ------------------------------------------------------------------ */}

      {/* 1. Onboard Staff Profile Modal */}
      {showAddProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowAddProfileModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Onboard Church Staff Member</h3>
              <p className="text-xs text-slate-400 font-semibold">Assigns job titles and sets up standard leaves allocated to this member.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Member <span className="text-rose-500">*</span></label>
                <select
                  value={profileForm.memberId}
                  onChange={e => setProfileForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">Select a congregation member...</option>
                  {workspaceMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email || 'No email'})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Job Title <span className="text-rose-500">*</span></label>
                  <input
                    value={profileForm.jobTitle}
                    onChange={e => setProfileForm(f => ({ ...f, jobTitle: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="Worship Director / Coordinator"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                  <input
                    type="date"
                    value={profileForm.startDate}
                    onChange={e => setProfileForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Emergency Contact</label>
                <input
                  value={profileForm.emergencyContact}
                  onChange={e => setProfileForm(f => ({ ...f, emergencyContact: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="Name and Phone number"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pastoral Notes</label>
                <textarea
                  value={profileForm.notes}
                  onChange={e => setProfileForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none h-20"
                  placeholder="Notes on character, onboarding plan..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddProfileModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleCreateProfile}
                  disabled={actionLoading || !profileForm.memberId || !profileForm.jobTitle}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Onboarding'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Leave Request Wizard with Conflict live updates */}
      {showAddLeaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowAddLeaveModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Submit Staff Leave Request</h3>
              <p className="text-xs text-slate-400 font-semibold">Checks active worship teams, sunday event roles, and volunteer schedules.</p>
            </div>

            <div className="space-y-4">
              {isLeaveApprover && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Member</label>
                  <select
                    value={leaveForm.memberId}
                    onChange={e => setLeaveForm(f => ({ ...f, memberId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="">Myself (Logged in Staff)</option>
                    {profiles.map(p => <option key={p.member.id} value={p.member.id}>{p.member.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={e => setLeaveForm(f => ({ ...f, leaveType: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="Annual">Annual Leave (Allocated 15)</option>
                  <option value="Sick">Sick Leave (Allocated 10)</option>
                  <option value="Spiritual">Spiritual Retreat / Care (Allocated 5)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {/* Roster conflict warning live block */}
              {conflictChecking && (
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                  <RefreshCw className="animate-spin text-indigo-600 w-4 h-4" />
                  <span className="text-[10px] text-slate-500 font-bold">Scanning Sunday Event rosters for active scheduling conflicts...</span>
                </div>
              )}

              {conflictWarning && conflictWarning.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle size={16} />
                    <h5 className="text-xs font-black uppercase tracking-wider">Active Ministry Scheduling Conflict Detected</h5>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-600 font-semibold space-y-1">
                    {conflictWarning.map((c, i) => (
                      <li key={i}>{c.name} on {new Date(c.date).toLocaleDateString()} (Role: {c.assignedRole})</li>
                    ))}
                  </ul>
                  <p className="text-[9px] text-slate-400 font-medium">Submitting this request will flag aCoverage Gap warning to pastors.</p>
                </div>
              )}

              {conflictWarning && conflictWarning.length === 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-emerald-700">
                  <CheckSquare size={14} />
                  <span className="text-[11px] font-bold">No overlapping worship planner or volunteer roster responsibilities found.</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason / Ministry Cover</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none h-16"
                  placeholder="Vacation, spiritual rest, retreat..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowAddLeaveModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleSubmitLeave}
                  disabled={actionLoading || !leaveForm.startDate || !leaveForm.endDate}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Submitting...' : 'Confirm Request'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Configure Compensation Structures Modal */}
      {showPayrollModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowPayrollModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Configure Staff Compensation Template</h3>
              <p className="text-xs text-slate-400 font-semibold">Sensitive financial metrics. Automatically links base, allowances & deductions to GL accounts.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Staff Member <span className="text-rose-500">*</span></label>
                <select
                  value={payrollForm.memberId}
                  onChange={e => setPayrollForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">Select active staff profile...</option>
                  {profiles.map(p => <option key={p.member.id} value={p.member.id}>{p.member.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Salary (INR) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    value={payrollForm.baseSalary}
                    onChange={e => setPayrollForm(f => ({ ...f, baseSalary: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Allowances</label>
                  <input
                    type="number"
                    value={payrollForm.allowances}
                    onChange={e => setPayrollForm(f => ({ ...f, allowances: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deductions</label>
                  <input
                    type="number"
                    value={payrollForm.deductions}
                    onChange={e => setPayrollForm(f => ({ ...f, deductions: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salary Expense GL Code</label>
                  <input
                    value={payrollForm.salaryExpenseAccountId}
                    onChange={e => setPayrollForm(f => ({ ...f, salaryExpenseAccountId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payroll Payable GL Code</label>
                  <input
                    value={payrollForm.payrollPayableAccountId}
                    onChange={e => setPayrollForm(f => ({ ...f, payrollPayableAccountId: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPayrollModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleSavePayroll}
                  disabled={actionLoading || !payrollForm.memberId || !payrollForm.baseSalary}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Saving...' : 'Set Compensation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Claim Reimbursement Modal */}
      {showReimburseModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowReimburseModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">File Petty Cash Expense claim</h3>
              <p className="text-xs text-slate-400 font-semibold">Submit ministry expenses with receipt. Posting will be verified before ledger validation.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount (INR) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    value={reimburseForm.amount}
                    onChange={e => setReimburseForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="e.g. 1500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Expense Category</label>
                  <select
                    value={reimburseForm.category}
                    onChange={e => setReimburseForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="Ministry">Ministry / Worship Needs</option>
                    <option value="Travel">Travel & Outreach Fuel</option>
                    <option value="Medical">Staff Welfare & Medical</option>
                    <option value="Other">Other ministry needs</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Purchase Description</label>
                <textarea
                  value={reimburseForm.description}
                  onChange={e => setReimburseForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none h-16"
                  placeholder="Receipt details, items description..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt Attachment URL</label>
                <input
                  value={reimburseForm.receiptUrl}
                  onChange={e => setReimburseForm(f => ({ ...f, receiptUrl: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowReimburseModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleFileReimburse}
                  disabled={actionLoading || !reimburseForm.amount}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Filing Claim...' : 'Confirm Submission'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Recruitment Pipeline Candidate */}
      {showCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowCandidateModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Log Pastoral Role Applicant</h3>
              <p className="text-xs text-slate-400 font-semibold">Add details of theological interns and pastor applicants to pipeline board.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Candidate Full Name <span className="text-rose-500">*</span></label>
                <input
                  value={candidateForm.candidateName}
                  onChange={e => setCandidateForm(f => ({ ...f, candidateName: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="e.g. Intern Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address <span className="text-rose-500">*</span></label>
                  <input
                    type="email"
                    value={candidateForm.email}
                    onChange={e => setCandidateForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="cand@gmail.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Applied Role <span className="text-rose-500">*</span></label>
                  <input
                    value={candidateForm.appliedRole}
                    onChange={e => setCandidateForm(f => ({ ...f, appliedRole: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="Worship Leader / Youth Intern"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes & Theological training</label>
                <textarea
                  value={candidateForm.notes}
                  onChange={e => setCandidateForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none h-16"
                  placeholder="Seminary details, experience, character notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowCandidateModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleAddCandidate}
                  disabled={actionLoading || !candidateForm.candidateName || !candidateForm.email || !candidateForm.appliedRole}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Adding Candidate...' : 'Add to Pipeline'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Onboarding Tasks Assignment Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowOnboardModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Assign Staff Onboarding checklist item</h3>
              <p className="text-xs text-slate-400 font-semibold">orientation steps like signing policies, safety training, child care certification.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Newly Hired Staff <span className="text-rose-500">*</span></label>
                <select
                  value={onboardForm.memberId}
                  onChange={e => setOnboardForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">Select staff profile...</option>
                  {profiles.map(p => <option key={p.member.id} value={p.member.id}>{p.member.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Task Name <span className="text-rose-500">*</span></label>
                  <input
                    value={onboardForm.taskName}
                    onChange={e => setOnboardForm(f => ({ ...f, taskName: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="Policy Signature / Child Safety Course"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={onboardForm.dueDate}
                    onChange={e => setOnboardForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowOnboardModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleAddOnboardTask}
                  disabled={actionLoading || !onboardForm.memberId || !onboardForm.taskName}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Assigning...' : 'Assign Task'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Write Performance Pastoral Rating Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowReviewModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Write Performance Feedback Review</h3>
              <p className="text-xs text-slate-400 font-semibold">Store spiritual leadership rating and department review in secure employee file.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Member Reviewed <span className="text-rose-500">*</span></label>
                <select
                  value={reviewForm.revieweeId}
                  onChange={e => setReviewForm(f => ({ ...f, revieweeId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">Select staff member...</option>
                  {profiles.map(p => <option key={p.member.id} value={p.member.id}>{p.member.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pastoral Ministry Rating (1-5)</label>
                <select
                  value={reviewForm.rating}
                  onChange={e => setReviewForm(f => ({ ...f, rating: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="5">5 - Excellent spiritual & ministry leadership</option>
                  <option value="4">4 - Highly stable department coordination</option>
                  <option value="3">3 - Standard performance coverage</option>
                  <option value="2">2 - Requires adjustment / training focus</option>
                  <option value="1">1 - Performance review action plan required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed Feedback Review</label>
                <textarea
                  value={reviewForm.feedback}
                  onChange={e => setReviewForm(f => ({ ...f, feedback: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-bold text-slate-900 focus:outline-none h-20"
                  placeholder="Review on department growth, character, and reliability..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spiritual Growth & Development Goals</label>
                <input
                  value={reviewForm.goals}
                  onChange={e => setReviewForm(f => ({ ...f, goals: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  placeholder="e.g. Expand youth group attendance by 10% / Attend pastor counseling seminar"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowReviewModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleSaveReview}
                  disabled={actionLoading || !reviewForm.revieweeId || !reviewForm.feedback}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Saving Review...' : 'Post Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Log Certification Record Modal */}
      {showTrainingModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowTrainingModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Add Certified Training record</h3>
              <p className="text-xs text-slate-400 font-semibold">Log theological completions, first aid courses, child care certifications.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Staff Member <span className="text-rose-500">*</span></label>
                <select
                  value={trainForm.memberId}
                  onChange={e => setTrainForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">Select staff profile...</option>
                  {profiles.map(p => <option key={p.member.id} value={p.member.id}>{p.member.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Course / Module Title <span className="text-rose-500">*</span></label>
                  <input
                    value={trainForm.courseName}
                    onChange={e => setTrainForm(f => ({ ...f, courseName: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="Child Safety Training"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Provider</label>
                  <input
                    value={trainForm.provider}
                    onChange={e => setTrainForm(f => ({ ...f, provider: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="e.g. Red Cross"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completion Date</label>
                  <input
                    type="date"
                    value={trainForm.completionDate}
                    onChange={e => setTrainForm(f => ({ ...f, completionDate: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Certificate No.</label>
                  <input
                    value={trainForm.certificationNo}
                    onChange={e => setTrainForm(f => ({ ...f, certificationNo: e.target.value }))}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                    placeholder="CERT-12345"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowTrainingModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleSaveTraining}
                  disabled={actionLoading || !trainForm.memberId || !trainForm.courseName}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Recording...' : 'Record Certification'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Configure Leave Policy Defaults Modal (tenant isolation) */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setShowPolicyModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Leave policy defaults</h3>
              <p className="text-xs text-slate-400 font-semibold">Default leave rules saved for your church in Settings.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annual Leave Days</label>
                <input
                  type="number"
                  value={policyForm.Annual}
                  onChange={e => setPolicyForm(f => ({ ...f, Annual: Number(e.target.value) }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sick Leave Days</label>
                <input
                  type="number"
                  value={policyForm.Sick}
                  onChange={e => setPolicyForm(f => ({ ...f, Sick: Number(e.target.value) }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spiritual / Retreat Leave Days</label>
                <input
                  type="number"
                  value={policyForm.Spiritual}
                  onChange={e => setPolicyForm(f => ({ ...f, Spiritual: Number(e.target.value) }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowPolicyModal(false)} className="flex-1 h-11 rounded-xl text-xs font-bold">Cancel</Button>
                <Button
                  onClick={handleUpdatePolicy}
                  disabled={actionLoading}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest"
                >
                  {actionLoading ? 'Updating...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Detail Overlay Modal for Staff Member Profile details --- */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-slate-900/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full p-8 space-y-6 shadow-2xl relative">
            <button onClick={() => setSelectedProfile(null)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <AppAvatar
                name={selectedProfile.member.name}
                className="w-16 h-16 rounded-2xl"
              />
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedProfile.member.name}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedProfile.jobTitle || 'Ministry Staff'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-indigo-50 text-indigo-700 border-none text-[8px] font-black uppercase tracking-widest">{selectedProfile.member.department || 'Ministry'}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 border-none text-[8px] font-black uppercase tracking-widest">{selectedProfile.status}</Badge>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Email Address</span>
                  <span className="font-bold text-slate-800">{selectedProfile.member.email || 'No email recorded'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Phone Number</span>
                  <span className="font-bold text-slate-800">{selectedProfile.member.phone || 'No phone recorded'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Start Date</span>
                  <span className="font-bold text-slate-800">
                    {selectedProfile.startDate ? new Date(selectedProfile.startDate).toLocaleDateString() : 'Not Set'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">Emergency Contact</span>
                  <span className="font-bold text-slate-800">{selectedProfile.emergencyContact || 'None listed'}</span>
                </div>
              </div>

              {selectedProfile.notes && (
                <div className="bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-600">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest block mb-1">Onboarding notes</span>
                  &ldquo;{selectedProfile.notes}&rdquo;
                </div>
              )}

              {canViewCompensation ? (
                <div className="bg-indigo-50/50 p-4 rounded-xl text-xs">
                  <span className="text-[8px] text-indigo-500 font-black uppercase tracking-widest block mb-1">Compensation</span>
                  <p className="font-semibold text-slate-700">
                    {payrollStructures.find(s => s.memberId === selectedProfile.memberId)
                      ? 'Payroll structure on file — open Payroll tab for details.'
                      : 'No payroll structure configured yet.'}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 font-semibold">Compensation details require Finance or HR access.</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => { setSelectedProfile(null); }}
                className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

    </PageLayout>
  );
}
