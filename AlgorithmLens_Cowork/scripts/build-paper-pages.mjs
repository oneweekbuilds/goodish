#!/usr/bin/env node
// Renders /methodology and /terms as static paper pages with the site's
// shared header and footer. The text is the React pages' text, rendered by
// React itself (react-dom/server) so nothing is retyped: the methodology's
// verbatim prompt strings and the terms' clauses come through byte for byte.
// Only the presentation changes: the app's Tailwind classes are mapped onto
// the paper system's few class names, and each page gets a contents list
// built from its own section headings (the headings' words, nothing added).
//
// The terms text is the July 2026 version that has been live at /terms. The
// app's newer draft in mobile/legal/TERMS_OF_SERVICE.md carries an unresolved
// note for counsel (D-166, 27 Sep 2026) and is deliberately not published
// here until counsel resolves it.
//
// The page chrome and the document styles follow the November 2026 facelift
// of the home page (dateline, rule, banner headline, ruled sections); they
// are shared with scripts/build-legal-pages.mjs through paper-document.mjs.
//
// Usage: node scripts/build-paper-pages.mjs
import { build } from 'esbuild';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { documentPage, withContents } from './paper-document.mjs';

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

// Styles for what these two documents contain: an opening paragraph set as a
// lede, the bulleted rows the React pages draw themselves, callouts, notes,
// the verbatim prompt blocks and the schema tables.
const PAPER_CSS = `.paper>section:first-of-type>p:first-child{font:20px/30px var(--serif);text-wrap:pretty}
.paper ul,.paper ol{margin:0 0 16px;padding-left:22px}
.paper ul{list-style:none;padding:0}
.paper li{margin:0 0 10px}
.bul{display:flex;gap:12px;align-items:flex-start}
.bul>:last-child{min-width:0;overflow-wrap:anywhere}
.paper p,.paper li{overflow-wrap:break-word}
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
@media(min-width:900px){.paper>section:first-of-type>p:first-child{font-size:21px;line-height:31px}}`;

const PAGES = [
  {
    src: 'MethodologyPage', out: 'methodology.html', pathName: '/methodology', eyebrow: 'Methodology',
    title: 'Methodology',
    description: 'How AlgorithmLens measures a feed: the schema, the exact prompts, where data goes, what has been measured about the instrument, and its limits.',
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
  const { body, contents } = withContents(restyle(inner(html, 'class="prose')));
  const doc = documentPage({
    title: p.title,
    description: p.description,
    canonical: 'https://www.algorithmlens.com' + p.pathName,
    eyebrow: p.eyebrow,
    meta: 'Last updated: ' + updated,
    contents,
    body,
    css: PAPER_CSS,
    scripts: true,
  });
  const outPath = path.join(root, 'public', p.out);
  writeFileSync(outPath, doc);
  console.log('wrote', outPath, doc.length, 'bytes');
}
rmSync(tmp, { recursive: true, force: true });
