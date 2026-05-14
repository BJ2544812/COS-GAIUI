import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { authenticateToken, requireAnyPermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();
router.use(tenantMiddleware);
router.use(authenticateToken);

router.get(
  '/members',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance',
  ),
  AnalyticsController.getMemberAnalytics as any,
);
router.get(
  '/financial',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance',
  ),
  AnalyticsController.getFinancialAnalytics as any,
);
router.get(
  '/attendance',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance',
  ),
  AnalyticsController.getAttendanceAnalytics as any,
);
router.get(
  '/growth',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance',
  ),
  AnalyticsController.getGrowthAnalytics as any,
);

router.get(
  '/risk',
  requireAnyPermission(
    'manage_giving',
    'manage_finance',
    'manage_members',
    'manage_attendance'
  ),
  AnalyticsController.risk as any
);

router.get(
  '/events',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance'
  ),
  AnalyticsController.getEventStats as any
);

router.get(
  '/events/timeline',
  requireAnyPermission(
    'manage_analytics',
    'manage_finance',
    'manage_giving',
    'manage_members',
    'manage_attendance'
  ),
  AnalyticsController.getEventTimeline as any
);

export default router;
