import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '12mm', bottom: '12mm', left: '12mm' },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/** Resolve logo/signature paths for Playwright PDF rendering. */
export function resolvePdfAssetSrc(assetPath?: string | null): string {
  const raw = String(assetPath || '').trim();
  if (!raw) return '';
  if (raw.startsWith('data:')) return raw;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const rel = raw.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  const full = path.join(process.cwd(), 'uploads', rel);
  if (fs.existsSync(full)) {
    const ext = path.extname(full).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png';
    const b64 = fs.readFileSync(full).toString('base64');
    return `data:${mime};base64,${b64}`;
  }
  return raw;
}
