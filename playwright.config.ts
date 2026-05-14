import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Port for the Playwright-managed Vite instance (must match `baseURL` and webServer).
 * 1) `PLAYWRIGHT_UI_PORT` env
 * 2) File written by `node scripts/write-playwright-ui-port.mjs` (see `npm run test:pw`)
 * 3) Non-CI fallback 3001 (local `npx playwright test` without writer — prefer PLAYWRIGHT_BASE_URL)
 */
function readPlaywrightUiPort(): number {
  const fromEnv = Number(process.env.PLAYWRIGHT_UI_PORT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  try {
    const f = path.join(__dirname, 'node_modules', '.cache', 'playwright-ui-port.txt');
    const n = Number(fs.readFileSync(f, 'utf8').trim());
    if (Number.isFinite(n) && n > 0) return n;
  } catch {
    /* missing file — e.g. `npx playwright test` without `npm run test:pw` */
  }
  if (process.env.CI === '1' || process.env.CI === 'true') {
    throw new Error(
      'Playwright: set PLAYWRIGHT_UI_PORT or run `node scripts/write-playwright-ui-port.mjs` before loading config (use `npm run test:pw`).'
    );
  }
  return 3001;
}

const PLAYWRIGHT_UI_PORT = readPlaywrightUiPort();

/**
 * UI smoke tests. Starts API + Vite when CI=1; locally reuse existing dev servers when set.
 *
 * Local: first time or after schema change run `npm run dev:prepare`, then `npm run dev:server` + `npm run dev`.
 * CI: `CI=1 npm run test:pw` (writes a free UI port, starts API with migrations, waits for health, then Vite).
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PLAYWRIGHT_UI_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI
    ? [
        {
          command: 'npm run dev:server:ci',
          url: 'http://127.0.0.1:4002/health',
          reuseExistingServer: true,
          timeout: 120_000,
        },
        {
          command: `node scripts/wait-for-health.mjs http://127.0.0.1:4002/health && npx cross-env DISABLE_HMR=true CI=1 npm run dev -- --port ${PLAYWRIGHT_UI_PORT} --strictPort`,
          url: `http://127.0.0.1:${PLAYWRIGHT_UI_PORT}`,
          reuseExistingServer: true,
          timeout: 180_000,
        },
      ]
    : undefined,
});
