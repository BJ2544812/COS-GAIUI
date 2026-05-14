import { Router } from 'express';
import { WebsiteController } from '../controllers/WebsiteController.js';
import { SermonController } from '../controllers/SermonController.js';
import { authenticateToken, requireAnyPermission, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middleware for public routes
router.use(tenantMiddleware);

// Public routes (No auth)
router.get('/public/pages', (req, res, next) => { console.log('HIT /public/pages'); next(); }, WebsiteController.getPublicPageList as any);
router.get('/public/pages/:slug', (req, res, next) => { console.log('HIT /public/pages/:slug', req.params); next(); }, WebsiteController.getPublicPageBySlug as any);
router.get('/public/events', WebsiteController.getPublicEvents as any);
router.get('/public/sermons', SermonController.getSermons as any);
router.get('/public/settings', WebsiteController.getPublicSettings as any);

// Protected routes (Requires Auth)
router.use((req, res, next) => { console.log('HIT authenticateToken middleware for', req.url); next(); }, authenticateToken);
router.get('/pages', requirePermission('manage_website'), WebsiteController.getPages as any);
router.get('/pages/:slug', requirePermission('manage_website'), WebsiteController.getAdminPageBySlug as any); // Admin can see drafts
router.delete('/pages', requirePermission('manage_website'), WebsiteController.wipeAllPages as any);
router.post('/pages', requirePermission('manage_website'), WebsiteController.createPageData as any);
router.patch('/pages/:slug', requirePermission('manage_website'), WebsiteController.updatePageData as any);
router.delete('/pages/:slug', requirePermission('manage_website'), WebsiteController.deletePage as any); // Added missing delete
router.post('/pages/:slug/publish', requirePermission('manage_website'), WebsiteController.publishPage as any);
router.post('/templates/apply', requirePermission('manage_website'), WebsiteController.applyTemplate as any);

/** Sermon reads: Events + Sermons modules use manage_events; website admins use manage_website. */
router.get('/sermons', requireAnyPermission('manage_events', 'manage_website'), SermonController.getSermons as any);
router.get('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.getSermonById as any);
router.post('/sermons', requireAnyPermission('manage_events', 'manage_website'), SermonController.createSermon as any);
router.put('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.updateSermon as any);
router.delete('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.deleteSermon as any);

export default router;
