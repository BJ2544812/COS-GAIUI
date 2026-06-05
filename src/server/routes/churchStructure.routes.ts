
import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { ChurchStructureController } from '../controllers/ChurchStructureController.js';

const churchStructureRouter = Router();

churchStructureRouter.use(tenantMiddleware);
churchStructureRouter.use(authenticateToken);

// --- Campuses ---
churchStructureRouter.get('/campuses', requirePermission('manage_settings'), ChurchStructureController.getCampuses as any);
churchStructureRouter.post('/campuses', requirePermission('manage_settings'), ChurchStructureController.createCampus as any);
churchStructureRouter.get('/campuses/:id', requirePermission('manage_settings'), ChurchStructureController.getCampusById as any);
churchStructureRouter.patch('/campuses/:id', requirePermission('manage_settings'), ChurchStructureController.updateCampus as any);

// --- Ministries ---
churchStructureRouter.get('/ministries', requirePermission('manage_settings'), ChurchStructureController.getMinistries as any);
churchStructureRouter.get('/ministries/:id/roster', requirePermission('manage_members'), ChurchStructureController.getMinistryRoster as any);
churchStructureRouter.post('/ministries', requirePermission('manage_settings'), ChurchStructureController.createMinistry as any);
churchStructureRouter.patch('/ministries/:id', requirePermission('manage_settings'), ChurchStructureController.updateMinistry as any);
churchStructureRouter.delete('/ministries/:id', requirePermission('manage_settings'), ChurchStructureController.deleteMinistry as any);

// --- Regions ---
churchStructureRouter.get('/regions', requirePermission('manage_settings'), ChurchStructureController.getRegions as any);
churchStructureRouter.post('/regions', requirePermission('manage_settings'), ChurchStructureController.createRegion as any);

// --- Zones ---
churchStructureRouter.get('/zones', requirePermission('manage_settings'), ChurchStructureController.getZones as any);
churchStructureRouter.post('/zones', requirePermission('manage_settings'), ChurchStructureController.createZone as any);

// --- Small Groups ---
churchStructureRouter.get('/small-groups', requirePermission('manage_members'), ChurchStructureController.getSmallGroups as any);
churchStructureRouter.post('/small-groups', requirePermission('manage_members'), ChurchStructureController.createSmallGroup as any);
churchStructureRouter.get('/small-groups/:id', requirePermission('manage_members'), ChurchStructureController.getSmallGroupById as any);
churchStructureRouter.patch('/small-groups/:id', requirePermission('manage_members'), ChurchStructureController.updateSmallGroup as any);
churchStructureRouter.delete('/small-groups/:id', requirePermission('manage_members'), ChurchStructureController.deleteSmallGroup as any);

// --- Small Group Members ---
churchStructureRouter.get('/small-groups/:id/members', requirePermission('manage_members'), ChurchStructureController.getSmallGroupMembers as any);
churchStructureRouter.post('/small-groups/:id/members', requirePermission('manage_members'), ChurchStructureController.addSmallGroupMember as any);
churchStructureRouter.patch('/small-groups/:id/members/:memberId', requirePermission('manage_members'), ChurchStructureController.updateSmallGroupMember as any);
churchStructureRouter.delete('/small-groups/:id/members/:memberId', requirePermission('manage_members'), ChurchStructureController.removeSmallGroupMember as any);

churchStructureRouter.get('/pathways', requirePermission('manage_members'), ChurchStructureController.getPathways as any);

export default churchStructureRouter;
