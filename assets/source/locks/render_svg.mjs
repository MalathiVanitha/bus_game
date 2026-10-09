import { chromium } from 'playwright';
import fs from 'fs';
const [src, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of fs.readdirSync(src).filter(f => f.endsWith('.svg'))) {
  const svg = fs.readFileSync(src + '/' + f, 'utf8');
  const [, w, h] = svg.match(/width="(\d+)" height="(\d+)"/);
  await page.setViewportSize({ width: +w, height: +h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: out + '/' + f.replace('.svg', '.png'), omitBackground: true, clip: { x: 0, y: 0, width: +w, height: +h } });
}
await browser.close();
