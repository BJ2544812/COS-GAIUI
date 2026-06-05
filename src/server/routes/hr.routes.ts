import { Router } from 'express';
import multer from 'multer';
import { HRController } from '../controllers/HRController.js';
import { authenticateToken, requireAnyPermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const hrRead = requireAnyPermission('manage_hr', 'manage_members', 'manage_finance');
const hrManage = requireAnyPermission('manage_hr', 'manage_members');
const hrFinance = requireAnyPermission('manage_hr', 'manage_finance');

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/command-center', hrRead, HRController.getCommandCenter as any);

router.get('/settings', hrRead, HRController.getSettings as any);
router.post('/settings', hrManage, HRController.updateSettings as any);

// --- Employment Profiles ---
router.get('/employment-profiles', hrRead, HRController.getEmploymentProfiles as any);
router.post('/employment-profiles', hrManage, HRController.createEmploymentProfile as any);
router.put('/employment-profiles/:id', hrManage, HRController.updateEmploymentProfile as any);
router.delete('/employment-profiles/:id', hrManage, HRController.deleteEmploymentProfile as any);

router.get('/leave-requests/conflicts', hrRead, HRController.checkLeaveConflictsHandler as any);
router.get('/leave-requests', hrRead, HRController.getLeaveRequests as any);
router.post('/leave-requests', hrRead, HRController.createLeaveRequest as any);
router.patch('/leave-requests/:id', hrManage, HRController.patchLeaveRequest as any);

router.get('/leave-balances', hrRead, HRController.getLeaveBalances as any);
router.post('/leave-balances', hrManage, HRController.adjustLeaveBalance as any);

router.get('/payroll-structures', hrFinance, HRController.getPayrollStructures as any);
router.post('/payroll-structures', hrFinance, HRController.createPayrollStructure as any);
router.put('/payroll-structures/:id', hrFinance, HRController.updatePayrollStructure as any);
router.post('/payroll/runs/generate', hrFinance, HRController.generatePayrollRun as any);

router.get('/reimbursements', hrRead, HRController.getReimbursementRequests as any);
router.post('/reimbursements', hrRead, HRController.createReimbursementRequest as any);
router.patch('/reimbursements/:id/approve', hrFinance, HRController.approveReimbursementRequest as any);

router.get('/documents', hrRead, HRController.getStaffDocuments as any);
router.post('/documents', hrManage, upload.single('file'), HRController.createStaffDocument as any);
router.delete('/documents/:id', hrManage, HRController.deleteStaffDocument as any);

// --- Performance Reviews ---
router.get('/performance', hrRead, HRController.getPerformanceReviews as any);
router.post('/performance', hrManage, HRController.createPerformanceReview as any);
router.patch('/performance/:id', hrManage, HRController.patchPerformanceReview as any);

// --- Training Records ---
router.get('/training', hrRead, HRController.getTrainingRecords as any);
router.post('/training', hrManage, HRController.createTrainingRecord as any);

// --- Recruitment Pipeline ---
router.get('/recruitment', hrRead, HRController.getRecruitmentPipeline as any);
router.post('/recruitment', hrManage, HRController.createRecruitmentPipeline as any);
router.patch('/recruitment/:id', hrManage, HRController.patchRecruitmentPipeline as any);

// --- Onboarding Checklists ---
router.get('/onboarding', hrRead, HRController.getOnboardingTasks as any);
router.post('/onboarding', hrManage, HRController.createOnboardingTask as any);
router.patch('/onboarding/:id', hrManage, HRController.patchOnboardingTask as any);

export default router;
