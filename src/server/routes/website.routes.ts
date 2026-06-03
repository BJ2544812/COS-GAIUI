import { Router } from 'express';
import { WebsiteController } from '../controllers/WebsiteController.js';
import { SermonController } from '../controllers/SermonController.js';
import { GivingController } from '../controllers/GivingController.js';
import { ChurchStructureController } from '../controllers/ChurchStructureController.js';
import { authenticateToken, requireAnyPermission, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { publicApiRateLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.use(tenantMiddleware);

// --- 1. PUBLIC ROUTES (No Auth) ---
router.use('/public', publicApiRateLimiter);
// Defined at the top to ensure priority and avoid falling into authenticateToken
router.get('/public/pages', WebsiteController.getPublicPageList as any);
router.get('/public/pages/:slug', WebsiteController.getPublicPageBySlug as any);
router.get('/public/events', WebsiteController.getPublicEvents as any);
router.get('/public/events/:id', WebsiteController.getPublicEventById as any);
router.post('/public/events/:id/register', WebsiteController.registerForPublicEvent as any);
router.get('/public/sermons', SermonController.getSermons as any);
router.get('/public/sermons/:id', SermonController.getPublicSermonById as any);
router.get('/public/settings', WebsiteController.getPublicSettings as any);
router.get('/public/ministries', ChurchStructureController.getMinistries as any);
router.get('/public/campuses', ChurchStructureController.getCampuses as any);
router.get('/public/leadership', WebsiteController.getPublicLeadership as any);
router.get('/public/campaigns', WebsiteController.getPublicCampaigns as any);
router.post('/public/prayer-requests', WebsiteController.createPublicPrayerRequest as any);
router.post('/public/giving/order', GivingController.createPublicGatewayOrder as any);
router.post('/public/giving/verify', GivingController.verifyPublicGatewayPayment as any);
router.post('/public/giving/estimate-fee', GivingController.estimateGatewayFee as any);
router.post('/public/giving/razorpay/order', GivingController.createRazorpayOrder as any);
router.post('/public/giving/razorpay/verify', GivingController.verifyPublicRazorpayPayment as any);

// --- 2. PROTECTED ROUTES (Requires Auth) ---
router.use(authenticateToken);

router.get('/pages', requirePermission('manage_website'), WebsiteController.getPages as any);
router.get('/pages/:slug', requirePermission('manage_website'), WebsiteController.getAdminPageBySlug as any);
router.delete('/pages', requirePermission('manage_website'), WebsiteController.wipeAllPages as any);
router.post('/pages', requirePermission('manage_website'), WebsiteController.createPageData as any);
router.patch('/pages/:slug', requirePermission('manage_website'), WebsiteController.updatePageData as any);
router.delete('/pages/:slug', requirePermission('manage_website'), WebsiteController.deletePage as any);
router.post('/pages/:slug/publish', requirePermission('manage_website'), WebsiteController.publishPage as any);
router.post('/templates/apply', requirePermission('manage_website'), WebsiteController.applyTemplate as any);
router.post('/templates/restore-flagship', requirePermission('manage_website'), WebsiteController.restoreFlagship as any);
router.get('/config/seo', requirePermission('manage_website'), WebsiteController.getWebsiteSeo as any);
router.put('/config/seo', requirePermission('manage_website'), WebsiteController.saveWebsiteSeo as any);
router.get('/config/media', requirePermission('manage_website'), WebsiteController.getWebsiteMedia as any);
router.post('/config/media', requirePermission('manage_website'), WebsiteController.addWebsiteMedia as any);
router.delete('/config/media/:id', requirePermission('manage_website'), WebsiteController.removeWebsiteMedia as any);
router.get('/structure/ministries', requireAnyPermission('manage_website', 'manage_settings'), ChurchStructureController.getMinistries as any);
router.get('/structure/campuses', requireAnyPermission('manage_website', 'manage_settings'), ChurchStructureController.getCampuses as any);
router.get('/giving/campaigns', requireAnyPermission('manage_website', 'manage_giving'), GivingController.getCampaigns as any);

router.get('/sermons', requireAnyPermission('manage_events', 'manage_website'), SermonController.getSermons as any);
router.get('/events', requireAnyPermission('manage_events', 'manage_website'), WebsiteController.getPublicEvents as any);
router.get('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.getSermonById as any);
router.post('/sermons', requireAnyPermission('manage_events', 'manage_website'), SermonController.createSermon as any);
router.put('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.updateSermon as any);
router.delete('/sermons/:id', requireAnyPermission('manage_events', 'manage_website'), SermonController.deleteSermon as any);

export default router;
