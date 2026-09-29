#!/usr/bin/env node
// Renders /methodology and /terms as static paper pages with the site's
// shared header and footer. The text is the React pages' text, rendered by
// React itself (react-dom/server) so nothing is retyped: the methodology's
// verbatim prompt strings and the terms' clauses come through byte for byte.
// Only the presentation changes: the app's Tailwind classes are mapped onto
// the paper system's few class names.
//
// The terms text is the July 2026 version that has been live at /terms. The
// app's newer draft in mobile/legal/TERMS_OF_SERVICE.md carries an unresolved
// note for counsel (D-166, 27 Sep 2026) and is deliberately not published
// here until counsel resolves it.
//
// Usage: node scripts/build-paper-pages.mjs
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const tmp = path.join(root, 'node_modules', '.cache', 'paper-pages');
mkdirSync(tmp, { recursive: true });

// Stubs for the app-only components: SEO writes head tags through Helmet
// (handled by the page template here), BackLink and the icons are chrome.
const stubs = {
  name: 'paper-stubs',
  setup(b) {
    b.onResolve({ filter: /components\/SEO$/ }, () => ({ path: 'stub-null', namespace: 'stub' }));
    b.onResolve({ filter: /components\/ui\/BackLink$/ }, () => ({ path: 'stub-null', namespace: 'stub' }));
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: 'stub-icons', namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
      contents: args.path === 'stub-icons'
        ? 'export const FileSearch = () => null; export const FileText = () => null;'
        : 'export default function Stub() { return null; }',
      loader: 'js',
    }));
  },
};

async function render(page) {
  const out = path.join(tmp, page + '.mjs');
  await build({
    entryPoints: [path.join(root, 'src', 'pages', page + '.jsx')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    outfile: out,
    plugins: [stubs],
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(out).href + '?t=' + Date.now());
  const React = (await import('react')).default;
  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(React.createElement(mod.default));
}

// Take the inner HTML of the first element whose class list contains `marker`.
function inner(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('marker not found: ' + marker);
  const open = html.lastIndexOf('<div', start);
  const openEnd = html.indexOf('>', start) + 1;
  let depth = 1, i = openEnd;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = openEnd;
  let m;
  while ((m = re.exec(html))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) { i = m.index; break; }
  }
  return html.slice(openEnd, i);
}

// Map the app's utility classes onto the paper system. Anything unmapped is
// dropped; the text nodes are untouched.
function restyle(html) {
  return html.replace(/\sclass="([^"]*)"/g, (all, cls) => {
    const c = ' ' + cls + ' ';
    const out = [];
    if (c.includes(' bg-blue-50 ')) out.push('callout');
    else if (c.includes(' bg-gray-50 ') && !c.includes(' text-left ')) out.push('note');
    if (c.includes(' overflow-x-auto ')) out.push('table-wrap');
    if (c.includes(' flex gap-3 ')) out.push('bul');
    if (c.includes(' flex-shrink-0 mt-1 ')) out.push('dot');
    if (c.includes(' font-mono ')) out.push('mono');
    if (c.includes(' list-decimal ')) out.push('numbered');
    if (c.includes(' text-sm ') && c.includes(' font-semibold ')) out.push('lead');
    return out.length ? ' class="' + out.join(' ') + '"' : '';
  }).replace(/<pre>/g, '<pre tabindex="0">');
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page({ title, description, pathName, eyebrow, updated, body, canonical }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | AlgorithmLens</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#F5F4F0">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AlgorithmLens">
<meta property="og:title" content="${esc(title)} | AlgorithmLens">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://www.algorithmlens.com/static/img/og-example.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="An example scan, labeled as an example: a grid of 45 marks, 6 of them blue for posts that carried an ad label.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)} | AlgorithmLens">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="https://www.algorithmlens.com/static/img/og-example.png">
<link rel="preload" href="/static/fonts/source-serif-4-regular.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-regular.woff2) format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-italic.woff2) format('woff2');font-weight:400;font-style:italic;font-display:swap}
:root{--paper:#F5F4F0;--panel:#FFFFFF;--field:#FFFDF9;--line:#DDD8CD;--muted:#6D685F;--ink:#3A3730;--ink-press:#141311;--blue:#1868D8;--blue-bg:#ECF3FC;--on-ink:#F7F5EF;--serif:Source,Georgia,"Times New Roman",serif;--sans:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;--shadow-pill:0 6px 16px rgba(58,55,48,.18);--tick:160ms;--beat:240ms;--ease:cubic-bezier(.22,1,.36,1);--gutter:24px}
@media(min-width:600px){:root{--gutter:48px}}
@media(min-width:900px){:root{--gutter:clamp(48px,8.333vw,120px)}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/25px var(--sans);-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
svg{display:block}
.wrap{max-width:1440px;margin:0 auto;padding:0 var(--gutter);width:100%}
a{color:var(--ink);text-underline-offset:4px;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
.skip{position:absolute;left:-999px;top:8px;background:var(--ink);color:var(--on-ink);padding:12px 16px;border-radius:8px;z-index:30}
.skip:focus{left:8px}
.pill{display:inline-flex;align-items:center;justify-content:center;background:var(--ink);color:var(--on-ink);border-radius:22px;height:44px;padding:0 18px;font:600 15px/1 var(--sans);text-decoration:none;white-space:nowrap;transition:transform var(--tick) var(--ease),background var(--tick),box-shadow var(--tick)}
.pill:hover{background:var(--ink-press);transform:translateY(-1px);box-shadow:var(--shadow-pill)}
.pill:active{transform:translateY(1px);box-shadow:none}
.topbar{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:1px solid var(--line);transition:background var(--beat),box-shadow var(--beat)}
.topbar.scrolled{background:rgba(245,244,240,.86);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--line),0 8px 24px rgba(58,55,48,.06)}
header.top{display:flex;justify-content:space-between;align-items:center;gap:24px;height:64px;transition:height var(--beat) var(--ease)}
.brand{width:139px;height:28px;display:flex;align-items:center;transition:width var(--beat) var(--ease)}
.brand svg{width:100%;height:auto}
.topnav{display:flex;align-items:center;gap:32px;margin-left:auto}
nav.sections{display:none;gap:32px;font-size:15px}
nav.sections a{position:relative;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;padding:6px 0}
nav.sections a::after{content:"";position:absolute;left:0;right:0;bottom:8px;height:2px;background:var(--blue);transform:scaleX(0);transform-origin:left;transition:transform var(--beat) var(--ease)}
nav.sections a:hover::after,nav.sections a:focus-visible::after{transform:scaleX(1)}
@media(min-width:900px){header.top{height:72px}.topbar.scrolled header.top{height:64px}.brand{width:188px;height:38px}.topbar.scrolled .brand{width:158px;height:32px}nav.sections{display:flex}.topbar .pill{padding:0 20px;margin-left:8px}}
main{flex:1;padding:40px 0 64px}
.head{display:flex;flex-direction:column;gap:16px;margin-bottom:40px}
.label{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--muted)}
.label::before{content:"";width:12px;height:12px;border:1.5px solid var(--ink);border-radius:50%}
h1{font:400 40px/44px var(--serif);letter-spacing:-.8px;margin:0;text-wrap:balance}
.meta{color:var(--muted);font-size:14px;margin:0}
.paper{max-width:66ch}
.paper h2{font:400 clamp(26px,2.5vw,32px)/1.19 var(--serif);letter-spacing:-.3px;margin:48px 0 16px;text-wrap:balance}
.paper h3{font:400 22px/28px var(--serif);margin:28px 0 8px}
.paper p{margin:0 0 16px}
.paper strong{font-weight:600}
.paper ul,.paper ol{margin:0 0 16px;padding-left:22px}
.paper ul{list-style:none;padding:0}
.paper li{margin:0 0 10px}
.bul{display:flex;gap:12px;align-items:flex-start}
.dot{flex-shrink:0;color:var(--muted)}
.callout{background:var(--blue-bg);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:0 0 16px}
.callout p,.callout li{margin-bottom:8px}
.callout ul{margin:0}
.callout .lead{font-weight:600;margin-bottom:10px}
.note{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:0 0 16px}
.note p{margin:0}
pre{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:18px 20px;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:0 0 24px;color:var(--ink)}
.table-wrap{overflow-x:auto;max-width:100%;border:1px solid var(--line);border-radius:16px;margin:0 0 16px;background:var(--panel)}
table{border-collapse:collapse;width:100%;font-size:14px;line-height:20px}
th,td{text-align:left;vertical-align:top;padding:10px 12px;border-top:1px solid var(--line)}
thead th{border-top:0;font-weight:600;background:var(--paper)}
td.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;white-space:nowrap}
td:nth-child(2){white-space:nowrap}
.numbered li{margin:0 0 12px}
@media(max-width:599px){.table-wrap table,.table-wrap tbody,.table-wrap tr,.table-wrap td{display:block}.table-wrap thead{display:none}.table-wrap tr{padding:12px 14px;border-top:1px solid var(--line)}.table-wrap tr:first-child{border-top:0}.table-wrap td{border:0;padding:0}.table-wrap td.mono{white-space:normal;font-size:13px;font-weight:600;margin-bottom:2px}.table-wrap td:nth-child(2){font-size:13px;color:var(--muted);margin-bottom:4px}}
@media(min-width:900px){main{padding:64px 0 96px}h1{font-size:clamp(44px,3.889vw,56px);line-height:1.107;letter-spacing:-1px}.head{gap:20px;margin-bottom:48px}}
footer.bottom{background:var(--panel);border-top:1px solid var(--line);padding:40px 0;color:var(--muted);font-size:14px;margin-top:auto}
.foot-brand{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.foot-brand .brand{width:139px;height:28px}
.foot-brand p{margin:0;font-size:15px;line-height:22px;color:var(--muted);max-width:360px}
.foot-cols{display:grid;grid-template-columns:1fr 1.4fr;gap:8px 16px}
.foot-col{display:flex;flex-direction:column;font-size:14px;line-height:28px}
.foot-col b{font-weight:600;color:var(--ink)}
.foot-col a{color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;min-height:30px}
.foot-col a:hover{text-decoration:underline;text-decoration-color:var(--blue);text-underline-offset:4px}
.foot-row{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:24px;padding-top:16px;border-top:1px solid var(--line);font-size:13px}
@media(min-width:900px){footer.bottom{padding:56px 0 48px}.foot-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px}.foot-brand{grid-column:1/span 4;gap:16px;margin:0}.foot-brand .brand{width:188px;height:38px}.foot-cols{display:contents}.foot-col{font-size:15px;line-height:30px}.foot-col.product{grid-column:6/span 2}.foot-col.company{grid-column:8/span 3}.foot-col.legal{grid-column:11/span 2}.foot-row{margin-top:32px;padding-top:20px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}.topbar.scrolled{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--paper)}.pill:hover{transform:none}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar" id="topbar"><div class="wrap">
<header class="top">
<a class="brand" href="/" aria-label="AlgorithmLens home"><svg viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens"><use href="/static/img/wordmark.svg#wordmark"/></svg></a>
<div class="topnav">
<nav class="sections" aria-label="Site">
<a href="/#how">How it works</a>
<a href="/#report">The report</a>
<a href="/#privacy">Privacy</a>
<a href="/methodology">Methodology</a>
</nav>
<a class="pill" href="/#launch">Join the launch list</a>
</div>
</header>
</div></div>
<main id="main"><div class="wrap">
<div class="head">
<span class="label">${esc(eyebrow)}</span>
<h1>${esc(title)}</h1>
<p class="meta">${esc(updated)}</p>
</div>
<div class="paper">
${body}
</div>
</div></main>
<footer class="bottom">
<div class="wrap">
<div class="foot-grid">
<div class="foot-brand">
<a class="brand" href="/" aria-label="AlgorithmLens home"><svg viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens"><use href="/static/img/wordmark.svg#wordmark"/></svg></a>
<p>A feed, made legible. Example data shown throughout is fictional.</p>
</div>
<div class="foot-cols">
<nav class="foot-col product" aria-label="Product"><b>Product</b><a href="/#report">The report</a><a href="/#how">How it works</a><a href="/#limits">Read the limits</a><a href="/explore/">Explore the example</a></nav>
<nav class="foot-col company" aria-label="Company"><b>Company</b><a href="/about/">About</a><a href="/methodology">Methodology</a><a href="/#privacy">Privacy</a><a href="mailto:privacy@algorithmlens.com">privacy@algorithmlens.com</a></nav>
<nav class="foot-col legal" aria-label="Legal"><b>Legal</b><a href="/privacy/">Privacy policy</a><a href="/terms">Terms</a></nav>
</div>
</div>
<div class="foot-row"><span>&copy; 2026 AlgorithmLens</span><span>A scan reads what appeared. It cannot say why.</span></div>
</div>
</footer>
<script src="/chrome.js"></script>
</body>
</html>
`;
}

const PAGES = [
  {
    src: 'MethodologyPage', out: 'methodology.html', pathName: '/methodology', eyebrow: 'Methodology',
    title: 'Methodology',
    description: 'How AlgorithmLens measures feed composition: the full extraction schema, the verbatim analysis prompts, the data flow, known limitations, and the validation study.',
  },
  {
    src: 'TermsPage', out: 'terms.html', pathName: '/terms', eyebrow: 'Terms',
    title: 'Terms of service',
    description: 'The terms that govern your use of the AlgorithmLens app and website.',
  },
];

for (const p of PAGES) {
  const html = await render(p.src);
  const updated = (html.match(/Last updated:\s*([^<]+)</) || [, ''])[1].trim();
  const body = restyle(inner(html, 'class="prose'));
  const doc = page({ ...p, updated: 'Last updated: ' + updated, body, canonical: 'https://www.algorithmlens.com' + p.pathName });
  const outPath = path.join(root, 'public', p.out);
  writeFileSync(outPath, doc);
  console.log('wrote', outPath, doc.length, 'bytes');
}
rmSync(tmp, { recursive: true, force: true });
