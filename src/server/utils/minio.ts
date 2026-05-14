import * as Minio from 'minio';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'password123',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'church-erp';

// Ensure bucket exists
export async function initializeMinio() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`MinIO bucket '${BUCKET_NAME}' created successfully.`);
      
      // Set bucket policy to allow public read
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`MinIO bucket '${BUCKET_NAME}' policy set to public read.`);
    } else {
      console.log(`MinIO bucket '${BUCKET_NAME}' already exists.`);
    }
  } catch (error) {
    const e = error as { code?: string; errors?: { code?: string }[] };
    const isConn =
      e?.code === 'ECONNREFUSED' ||
      (Array.isArray(e?.errors) && e.errors.some((x) => x?.code === 'ECONNREFUSED'));
    if (isConn) {
      console.warn(
        '[minio] Not reachable (optional for uploads). Start MinIO or set MINIO_*; server continues.'
      );
    } else {
      console.error('Error initializing MinIO:', error);
    }
  }
}

export { BUCKET_NAME };
