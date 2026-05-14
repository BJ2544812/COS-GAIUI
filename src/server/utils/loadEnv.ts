/**
 * Central `.env` load for Node (API, Prisma CLI config, scripts).
 *
 * dotenv's default is NOT to override variables already set in the process environment.
 * A stale `DATABASE_URL` in the shell (e.g. from a test pointing at 127.0.0.1:59999) will
 * therefore mask `.env` and break Prisma. In non-production we override so repo `.env` wins.
 */
import { config } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadProjectEnv(): void {
  const envPath = resolve(process.cwd(), '.env');
  const override = process.env.NODE_ENV === 'production' ? false : true;
  if (existsSync(envPath)) {
    const prevDb = process.env.DATABASE_URL;
    const result = config({ path: envPath, override });
    if (result.error) {
      console.warn('[env] Failed to parse .env:', result.error.message);
      return;
    }
    if (prevDb && prevDb !== process.env.DATABASE_URL) {
      console.warn(
        '[env] DATABASE_URL was replaced from values in `.env` (non-production override). ' +
          'If you rely on a system-level DATABASE_URL, unset it or set NODE_ENV=production.',
      );
    }
  } else {
    config();
  }
}

loadProjectEnv();
