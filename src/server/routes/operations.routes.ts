import { Router } from 'express';
import { OperationsController } from '../controllers/OperationsController.js';
import { VolunteerOpsController } from '../controllers/VolunteerOpsController.js';
import { MinistryIntelligenceController } from '../controllers/MinistryIntelligenceController.js';
import { authenticateToken, requireAnyPermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);
router.use(
  requireAnyPermission(
    'manage_events',
    'manage_attendance',
    'manage_members',
    'manage_communication',
    'manage_analytics',
  ),
);

router.get('/command-center', OperationsController.getCommandCenter as any);
router.get('/operational-insights', OperationsController.getOperationalInsights as any);
router.get('/volunteer-board', VolunteerOpsController.getBoard as any);
router.get('/volunteer-insights', VolunteerOpsController.getInsights as any);
router.get('/volunteer-substitutes', VolunteerOpsController.substitutes as any);
router.post('/volunteer-reassign', VolunteerOpsController.reassign as any);

router.get('/ministry-intelligence', MinistryIntelligenceController.getFull as any);
router.get('/ministry-intelligence/volunteer-health', MinistryIntelligenceController.getVolunteerHealth as any);
router.get('/ministry-intelligence/service-health', MinistryIntelligenceController.getServiceHealth as any);
router.get('/ministry-intelligence/event-health', MinistryIntelligenceController.getEventHealth as any);
router.get('/ministry-intelligence/predictive', MinistryIntelligenceController.getPredictive as any);
router.get('/ministry-intelligence/engagement', MinistryIntelligenceController.getEngagement as any);
router.get('/ministry-intelligence/follow-up', MinistryIntelligenceController.getFollowUp as any);
router.get('/ministry-intelligence/executive', MinistryIntelligenceController.getExecutive as any);
router.get('/ministry-intelligence/pastoral', MinistryIntelligenceController.getPastoral as any);
router.get('/ministry-intelligence/campus-overview', MinistryIntelligenceController.getCampusOverview as any);
router.get('/members/:memberId/ministry-journey', MinistryIntelligenceController.getMinistryJourney as any);

export default router;
