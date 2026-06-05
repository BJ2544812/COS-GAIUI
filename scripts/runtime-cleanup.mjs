#!/usr/bin/env node
/**
 * Stop stale Kingdom Church OS dev processes (API, Vite, workers on known ports).
 * Usage: npm run runtime:clean
 */
import { execSync, spawnSync } from 'node:child_process';

const PORTS = (process.env.RUNTIME_CLEAN_PORTS || '4002,3001,24678')
  .split(',')
  .map((p) => Number(p.trim()))
  .filter((p) => Number.isFinite(p) && p > 0);

function killPortWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = new Set();
    for (const line of out.split('\n')) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      console.log(`[runtime:clean] Killing PID ${pid} (port ${port})`);
      spawnSync('taskkill', ['/PID', pid, '/F'], { stdio: 'inherit', shell: true });
    }
    return pids.size;
  } catch {
    return 0;
  }
}

function killPortUnix(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    for (const pid of pids) {
      console.log(`[runtime:clean] Killing PID ${pid} (port ${port})`);
      spawnSync('kill', ['-9', pid], { stdio: 'inherit' });
    }
    return pids.length;
  } catch {
    return 0;
  }
}

console.log('[runtime:clean] Clearing stale listeners on ports:', PORTS.join(', '));
let total = 0;
for (const port of PORTS) {
  total += process.platform === 'win32' ? killPortWindows(port) : killPortUnix(port);
}
console.log(`[runtime:clean] Done (${total} process(es) terminated).`);
