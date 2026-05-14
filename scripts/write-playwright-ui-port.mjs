/**
 * Pick a free TCP port and write it for Playwright (see playwright.config.ts).
 * Run before `playwright test` via `npm run test:pw` so the UI server and baseURL stay in sync.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import getPort from 'get-port';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'node_modules', '.cache');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'playwright-ui-port.txt');

/** Prefer an ephemeral free port so we do not collide with a leftover `vite --port 52847` from a prior run. */
const port = await getPort();

fs.writeFileSync(file, String(port), 'utf8');
console.log('[playwright-ui-port] wrote', file, '→', port);
