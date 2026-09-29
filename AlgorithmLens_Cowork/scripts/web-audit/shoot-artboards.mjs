// Full-page renders of the polish design's artboards (.dc.html) so the after
// screenshots can be laid beside them. The artboards reference the wordmark
// as a blob URL and a support script that is not in the bundle; both are
// rewritten in a temporary copy, the design folder itself is not touched.
//   node scripts/web-audit/shoot-artboards.mjs <designDir> <outDir>
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const DESIGN = resolve(process.argv[2]);
const OUT = resolve(process.argv[3]);
mkdirSync(OUT, { recursive: true });
const tmp = join(tmpdir(), 'al-artboards-' + Date.now());
mkdirSync(tmp);
copyFileSync(join(DESIGN, 'wordmark.svg'), join(tmp, 'wordmark.svg'));

const shots = [
  ['Main.dc.html', 390, 'artboard-main-390.jpg'],
  ['Landing-Desktop.dc.html', 1440, 'artboard-landing-1440.jpg'],
  ['About.dc.html', 1440, 'artboard-about-1440.jpg'],
  ['NotFound.dc.html', 1440, 'artboard-notfound-1440.jpg'],
  ['Chrome.dc.html', 1440, 'artboard-chrome-1440.jpg'],
  ['Tokens.dc.html', 1440, 'artboard-tokens-1440.jpg'],
];
const browser = await chromium.launch();
for (const [file, width, name] of shots) {
  const html = readFileSync(join(DESIGN, file), 'utf8')
    .replace(/\/_blob\/[0-9a-f]+/g, './wordmark.svg')
    .replace(/<script src="\.\/support\.js"><\/script>/, '');
  const local = join(tmp, file.replace('.dc.html', '.html'));
  writeFileSync(local, html);
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(pathToFileURL(local).href, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, name), fullPage: true, type: 'jpeg', quality: 80 });
  await page.close();
  console.log('shot', name);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
