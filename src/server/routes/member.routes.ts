import { Router } from 'express';
import multer from 'multer';
import { MemberController } from '../controllers/MemberController.js';
import { MemberProfileController } from '../controllers/MemberProfileController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

// --- Core Member CRUD ---
router.post('/', requirePermission('manage_members'), MemberController.createMember as any);
router.post('/import', requirePermission('manage_members'), MemberController.importMembers as any);
router.get('/', requirePermission('manage_members'), MemberController.getMembers as any);
router.get('/:id', requirePermission('manage_members'), MemberController.getMemberById as any);
router.put('/:id', requirePermission('manage_members'), MemberController.updateMember as any);
router.delete('/:id', requirePermission('manage_members'), MemberController.deleteMember as any);

// --- Profile Image ---
router.post(
  '/:id/profile-image',
  requirePermission('manage_members'),
  upload.single('file'),
  MemberProfileController.uploadProfileImage as any
);

// --- Identity Documents ---
router.get('/:id/documents', requirePermission('manage_members'), MemberProfileController.getDocuments as any);
router.post('/:id/documents', requirePermission('manage_members'), upload.single('file'), MemberProfileController.createDocument as any);
router.patch('/:id/documents/:docId', requirePermission('manage_members'), MemberProfileController.updateDocument as any);
router.delete('/:id/documents/:docId', requirePermission('manage_members'), MemberProfileController.deleteDocument as any);

router.post(
  '/:id/generated-documents',
  requirePermission('manage_members'),
  MemberProfileController.generateIdentityDocument as any
);

// --- Spiritual Milestones ---
router.get('/:id/milestones', requirePermission('manage_members'), MemberProfileController.getMilestones as any);
router.post('/:id/milestones', requirePermission('manage_members'), MemberProfileController.createMilestone as any);
router.patch('/:id/milestones/:milestoneId', requirePermission('manage_members'), MemberProfileController.updateMilestone as any);
router.delete('/:id/milestones/:milestoneId', requirePermission('manage_members'), MemberProfileController.deleteMilestone as any);

// --- Care Notes ---
router.get('/:id/care-notes', requirePermission('manage_members'), MemberProfileController.getCareNotes as any);
router.post('/:id/care-notes', requirePermission('manage_members'), MemberProfileController.createCareNote as any);

// --- Responsibilities ---
router.get('/:id/responsibilities', requirePermission('manage_members'), MemberProfileController.getResponsibilities as any);
router.post('/:id/responsibilities', requirePermission('manage_members'), MemberProfileController.createResponsibility as any);
router.patch('/:id/responsibilities/:resId', requirePermission('manage_members'), MemberProfileController.updateResponsibility as any);
router.delete('/:id/responsibilities/:resId', requirePermission('manage_members'), MemberProfileController.deleteResponsibility as any);

// --- Family Linking ---
router.post('/:id/family/link', requirePermission('manage_members'), MemberProfileController.linkFamily as any);
router.post('/:id/family/unlink', requirePermission('manage_members'), MemberProfileController.unlinkFamily as any);

export default router;
