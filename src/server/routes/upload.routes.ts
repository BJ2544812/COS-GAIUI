import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/UploadController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

// Assuming manage_settings is required, but perhaps allow generic uploads for users if needed.
// For now, tying it to settings management or generic auth.
router.post('/', upload.single('file'), UploadController.uploadFile as any);

export default router;
