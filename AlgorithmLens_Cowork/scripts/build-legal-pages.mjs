#!/usr/bin/env node
// Renders the app's privacy policy (mobile/legal/PRIVACY_POLICY.md) as a
// static page in the site's field system, so the website and the app show
// one text. The policy wording is not changed; only its Markdown is turned
// into HTML and its em dashes (which the site's copy rules forbid) become
// colons after a bold lead-in and commas elsewhere.
//
// Usage: node scripts/build-legal-pages.mjs [path/to/PRIVACY_POLICY.md] [out.html]
// Defaults: ../mobile/legal/PRIVACY_POLICY.md -> public/privacy/index.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || path.join(here, '..', 'mobile', 'legal', 'PRIVACY_POLICY.md');
const out = process.argv[3] || path.join(here, '..', 'public', 'privacy', 'index.html');

const md = readFileSync(src, 'utf8');
const lines = md.split(/\r?\n/);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  let t = esc(s);
  // Em dashes: a colon after a bold lead-in, a comma elsewhere.
  t = t.replace(/\*\*\s+—\s+/g, '**: ').replace(/\s+—\s+/g, ', ').replace(/—/g, ', ');
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[\s(])\*([^*]+)\*(?=[\s).,;:]|$)/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

const body = [];
let i = 0;
let title = 'Privacy policy';
let inList = null;
const closeList = () => { if (inList) { body.push(inList === 'ul' ? '</ul>' : '</ol>'); inList = null; } };
while (i < lines.length) {
  const line = lines[i];
  if (/^\s*$/.test(line)) { closeList(); i++; continue; }
  let m;
  if ((m = line.match(/^# (.+)/))) { closeList(); title = m[1].trim(); i++; continue; }
  if ((m = line.match(/^## (.+)/))) { closeList(); body.push(`<h2>${inline(m[1])}</h2>`); i++; continue; }
  if ((m = line.match(/^### (.+)/))) { closeList(); body.push(`<h3>${inline(m[1])}</h3>`); i++; continue; }
  if (/^---+\s*$/.test(line)) { closeList(); body.push('<hr>'); i++; continue; }
  if (line.startsWith('|')) {
    closeList();
    const rows = [];
    while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i]); i++; }
    const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const head = cells(rows[0]);
    const data = rows.slice(2).map(cells);
    body.push('<div class="table-wrap"><table><thead><tr>' + head.map((h) => `<th scope="col">${inline(h)}</th>`).join('') + '</tr></thead><tbody>' +
      data.map((r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
    continue;
  }
  if ((m = line.match(/^- (.+)/))) { if (inList !== 'ul') { closeList(); body.push('<ul>'); inList = 'ul'; } body.push(`<li>${inline(m[1])}</li>`); i++; continue; }
  if ((m = line.match(/^\d+\. (.+)/))) { if (inList !== 'ol') { closeList(); body.push('<ol>'); inList = 'ol'; } body.push(`<li>${inline(m[1])}</li>`); i++; continue; }
  if (line.startsWith('> ')) { closeList(); const q = []; while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; } body.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue; }
  // paragraph: gather consecutive plain lines
  closeList();
  const para = [];
  while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|- |\d+\. |\||---|> )/.test(lines[i])) { para.push(lines[i]); i++; }
  body.push(`<p>${inline(para.join(' '))}</p>`);
}
closeList();

const updated = (md.match(/\*\*Last Updated:\*\*\s*([^\n]+)/) || [])[1] || '';

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | AlgorithmLens</title>
<meta name="description" content="What AlgorithmLens collects, how a scan is processed and deleted, and your rights over your data. The same text the app shows.">
<link rel="canonical" href="https://www.algorithmlens.com/privacy/">
<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#F5F4F0">
<meta name="robots" content="index,follow">
<style>
@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-regular.woff2) format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-italic.woff2) format('woff2');font-weight:400;font-style:italic;font-display:swap}
:root{--blue:#1868D8;--green:#20A888;--ink:#3A3730;--paper:#F5F4F0;--line:#DDD8CD;--muted:#6D685F;--surface:#FFFDF9}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 system-ui,sans-serif}
main{max-width:720px;margin:auto;padding:24px 20px 48px}
header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
header a{display:inline-flex;align-items:center;min-height:44px}
header svg{width:150px;height:auto}
a{color:var(--ink);text-underline-offset:4px}
a:focus-visible{outline:2px solid var(--blue);outline-offset:4px}
h1{font:400 clamp(34px,6vw,52px)/1.08 Source,Georgia,serif;letter-spacing:-1px;margin:8px 0 8px}
h2{font:400 clamp(24px,3.4vw,32px)/1.15 Source,Georgia,serif;margin:40px 0 12px}
h3{font:400 22px/1.2 Source,Georgia,serif;margin:28px 0 8px}
p,li{max-width:66ch}
.meta{color:var(--muted);font-size:14px;margin:0 0 20px}
.site-note{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin:0 0 8px}
.site-note h2{margin-top:0;font-size:24px}
.site-note p{margin:8px 0}
hr{border:0;border-top:1px solid var(--line);margin:28px 0}
.table-wrap{overflow-x:auto;max-width:100%;margin:12px 0}
table{border-collapse:collapse;width:100%;font-size:15px}
td,th{min-width:12ch}
code,a{overflow-wrap:anywhere}
th,td{text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid var(--line)}
th{font-weight:600}
blockquote{margin:16px 0;padding:12px 16px;border-left:2px solid var(--line);color:var(--muted)}
code{font-family:ui-monospace,monospace;font-size:14px}
nav.foot{display:flex;gap:18px;flex-wrap:wrap;border-top:1px solid var(--line);margin-top:40px;padding-top:8px}
nav.foot a{display:inline-flex;align-items:center;min-height:44px}
</style>
</head>
<body>
<main>
<header>
<a href="/" aria-label="AlgorithmLens home"><svg viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens"><use href="/static/img/wordmark.svg#wordmark"/></svg></a>
<a href="/">Front page</a>
</header>
<h1>${esc(title)}</h1>
<p class="meta">Last updated ${esc(updated)}. This is the same text the AlgorithmLens app shows in Settings.</p>
<section class="site-note" aria-labelledby="site-note-title">
<h2 id="site-note-title">This website</h2>
<p>The pages on algorithmlens.com set no cookies, run no analytics, and request nothing from third parties. The only data they send anywhere is the launch-list form: when you submit it, your email address and your consent are sent to our launch-list service (a function hosted for us by Supabase) and stored there so that we can send launch news. Nothing is sent until you press the button, and nothing is saved if the service reports a failure.</p>
<p>Your address is used only for launch news and is never sold or shared. To be removed from the list, write to <a href="mailto:privacy@algorithmlens.com">privacy@algorithmlens.com</a> from the address you signed up with.</p>
<p>The example scans shown on this site are fictional. Nothing on this site records your screen or reads your feed.</p>
</section>
${body.join('\n')}
<nav class="foot" aria-label="More pages">
<a href="/">Front page</a>
<a href="/explore/">Explore the example</a>
<a href="/terms">Terms</a>
<a href="mailto:privacy@algorithmlens.com">privacy@algorithmlens.com</a>
</nav>
</main>
</body>
</html>
`;

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes, from', src, '(last updated', updated + ')');
