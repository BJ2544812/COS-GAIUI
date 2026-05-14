import './loadEnv.ts';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  /** Fail fast when Postgres is down so the process can still reach listen() and /health. */
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10_000),
  idleTimeoutMillis: 30_000,
});
const adapter = new PrismaPg(pool);

console.log('[prisma] Singleton initialized');
export const prisma = new PrismaClient({ adapter });
