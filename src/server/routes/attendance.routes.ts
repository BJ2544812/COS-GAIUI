import { Router } from 'express';
import { AttendanceController } from '../controllers/AttendanceController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

// Analytics
router.get('/metrics', requirePermission('manage_attendance'), AttendanceController.getMetrics as any);

// Session Routes
router.get('/sessions', requirePermission('manage_attendance'), AttendanceController.getSessions as any);
router.post('/sessions', requirePermission('manage_attendance'), AttendanceController.createSession as any);
router.get('/sessions/:id', requirePermission('manage_attendance'), AttendanceController.getSessionById as any);
router.patch('/sessions/:id', requirePermission('manage_attendance'), AttendanceController.updateSession as any);

// Attendance Record Routes
router.get('/sessions/:id/records', requirePermission('manage_attendance'), AttendanceController.getSessionRecords as any);
router.post('/sessions/:id/records', requirePermission('manage_attendance'), AttendanceController.recordAttendance as any);
router.post('/record', requirePermission('manage_attendance'), AttendanceController.recordAttendance as any); // fallback

router.get('/event/:eventId', requirePermission('manage_attendance'), AttendanceController.getAttendanceForEvent as any);

export default router;
