import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { minioClient, BUCKET_NAME } from '../utils/minio.js';
import crypto from 'crypto';

export class UploadController {
  static async uploadFile(req: TenantRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const tenantId = req.tenantId || 'default';
      const file = req.file;
      const extension = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
      const uniqueId = crypto.randomBytes(8).toString('hex');

      // Structured key: tenantId/settings/<uniqueId>.<ext>
      // This organises files per tenant, making management and cleanup easy
      const objectName = `${tenantId}/settings/${uniqueId}.${extension}`;

      // Upload to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      // Generate public URL (bucket is set to public read on init)
      const host = process.env.MINIO_ENDPOINT || 'localhost';
      const port = process.env.MINIO_PORT || '9000';
      const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
      const url = `${protocol}://${host}:${port}/${BUCKET_NAME}/${objectName}`;

      res.status(200).json({
        status: 'success',
        data: {
          url,
          key: objectName,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
    } catch (error: any) {
      console.error('[UploadController] Error:', error);
      res.status(500).json({ error: 'Failed to upload file to storage. Ensure MinIO is running.' });
    }
  }
}
