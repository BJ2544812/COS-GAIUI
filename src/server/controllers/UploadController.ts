import { Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { minioClient, BUCKET_NAME } from '../utils/minio.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml']);

function ensureDir(subdir: string) {
  const dir = path.join(UPLOADS_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function storeLocal(file: Express.Multer.File, objectName: string): Promise<string> {
  const dir = ensureDir(path.dirname(objectName));
  const filePath = path.join(dir, path.basename(objectName));
  fs.writeFileSync(filePath, file.buffer);
  return `/uploads/${objectName}`;
}

async function storeMinio(file: Express.Multer.File, objectName: string): Promise<string> {
  await minioClient.putObject(BUCKET_NAME, objectName, file.buffer, file.size, {
    'Content-Type': file.mimetype,
  });
  const host = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  return `${protocol}://${host}:${port}/${BUCKET_NAME}/${objectName}`;
}

export class UploadController {
  static async uploadFile(req: TenantRequest, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const tenantId = req.tenantId!;
      const file = req.file;

      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type. Use PNG, JPEG, WebP, GIF, or SVG.',
        });
      }

      const extension = file.originalname.split('.').pop()?.toLowerCase() || 'bin';
      const uniqueId = crypto.randomBytes(8).toString('hex');
      const scope = String(req.query.scope ?? req.body?.scope ?? 'settings').trim().toLowerCase();
      const eventId = String(req.query.eventId ?? req.body?.eventId ?? '').trim();
      const folder =
        scope === 'events' && eventId
          ? `events/${tenantId}/${eventId}`
          : `${tenantId}/settings`;
      const objectName = `${folder}/${uniqueId}.${extension}`;

      let url: string;
      try {
        url = await storeMinio(file, objectName);
      } catch (minioErr) {
        console.warn('[UploadController] MinIO unavailable, using local storage:', minioErr);
        url = await storeLocal(file, objectName);
      }

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
    } catch (error: unknown) {
      console.error('[UploadController] Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to upload file',
      });
    }
  }
}
