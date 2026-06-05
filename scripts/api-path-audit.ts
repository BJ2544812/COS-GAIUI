/**
 * Static audit: flag frontend API paths that bypass resolveApiUrl / apiRequest / apiFetch.
 * Run: npx tsx scripts/api-path-audit.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(process.cwd(), 'src');
const IGNORE = new Set([
  'src/server',
  'src/lib/apiConfig.ts',
  'src/lib/apiClient.ts',
  'src/lib/authSession.ts',
  'src/lib/runtimeApiGuard.ts',
  'src/vite-env.d.ts',
]);

const patterns: { name: string; re: RegExp }[] = [
  { name: 'hardcoded /api/ (not v1)', re: /['"`]\/api\/(?!v1\/)/ },
  { name: 'localhost:4002 in frontend', re: /localhost:4002/ },
  { name: 'fetch without resolveApiUrl/apiFetch nearby', re: /\bfetch\s*\(/ },
  { name: 'axios usage', re: /\baxios\b/ },
  { name: 'manual finance/ path concat', re: /['"`]\/finance\// },
  { name: 'manual giving/ path concat', re: /['"`]\/giving\// },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(abs, out);
    else if (/\.(tsx?|jsx?)$/.test(ent.name)) out.push(abs);
  }
  return out;
}

type Finding = { file: string; line: number; rule: string; text: string };

const findings: Finding[] = [];

for (const file of walk(SRC)) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  if ([...IGNORE].some((p) => rel.startsWith(p))) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((text, i) => {
    const prev = i > 0 ? lines[i - 1] : '';
    const ctx = `${prev}\n${text}`;
    for (const { name, re } of patterns) {
      if (!re.test(text)) continue;
      if (text.includes('apiRequest') || text.includes('apiFetch') || text.includes('apiDownloadBlob')) continue;
      if (name.startsWith('fetch') && (ctx.includes('resolveApiUrl') || text.includes('apiFetch'))) continue;
      if ((name.includes('finance') || name.includes('giving')) && text.includes('apiRequest')) continue;
      findings.push({ file: rel, line: i + 1, rule: name, text: text.trim().slice(0, 120) });
    }
  });
}

console.log(`API path audit — ${findings.length} finding(s)\n`);
for (const f of findings) {
  console.log(`${f.file}:${f.line} [${f.rule}] ${f.text}`);
}
if (findings.length > 0) process.exit(1);
console.log('OK — no suspicious API path patterns in frontend src.');
