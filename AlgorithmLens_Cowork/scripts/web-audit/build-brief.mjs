// Builds the unlisted design brief at public/design-brief/index.html.
//   node scripts/web-audit/build-brief.mjs
// Expects fresh captures in public/design-brief/shots (shoot-live.mjs with
// ONLY=390,1440 NOSTATES=1). Reads tokens from the live CSS, not the repo.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd(), '..');
const OUT = resolve(process.cwd(), 'public/design-brief');
const BASE = 'https://www.algorithmlens.com';
mkdirSync(resolve(OUT, 'old'), { recursive: true });

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Minimal markdown to HTML ----------
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[i])}</code>`);
}
function md(src, idPrefix) {
  const lines = src.replace(/\r/g, '').split('\n');
  const out = [];
  let i = 0;
  const cells = (l) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim());
  while (i < lines.length) {
    const l = lines[i];
    if (/^```/.test(l)) {
      const buf = []; i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++; out.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`); continue;
    }
    const h = l.match(/^(#{1,6})\s+(.*)/);
    if (h) {
      const lvl = Math.min(h[1].length + 2, 6);
      const id = idPrefix + '-' + h[2].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      out.push(`<h${lvl} id="${id}">${inline(h[2])}</h${lvl}>`); i++; continue;
    }
    if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[i + 1])) {
      const head = cells(l); i += 2; const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l); const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*]|\d+\.)\s+/, '');
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(`<li>${inline(item)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`); continue;
    }
    if (/^>\s?/.test(l)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`); continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*\||\s*([-*]|\d+\.)\s+|>)/.test(lines[i])) buf.push(lines[i++].trim());
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

// ---------- Live CSS ----------
async function text(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }
const inlineStyles = (html) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const sources = [];
for (const [name, path] of [['Root', '/'], ['Film page', '/explore/experience-film.html'], ['Privacy', '/privacy/'], ['404', '/this-page-does-not-exist']]) {
  const r = await fetch(BASE + path); sources.push({ name, url: BASE + path, css: inlineStyles(await r.text()) });
}
for (const [name, path] of [['Explorer', '/explore/explore.css'], ['Specimen', '/explore/specimen.css']]) sources.push({ name, url: BASE + path, css: await text(BASE + path) });
{
  const html = await text(BASE + '/terms');
  for (const m of html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)) sources.push({ name: 'Terms and methodology app', url: BASE + m[1], css: await text(BASE + m[1]), varsOnly: true });
}

function rules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = []; let depth = 0, start = 0, sel = '', media = '';
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '{') {
      const s = css.slice(start, i).trim();
      if (depth === 0 && s.startsWith('@')) { media = s; depth = 1; start = i + 1; continue; }
      sel = s; start = i + 1; depth++;
    } else if (c === '}') {
      if (sel) { out.push({ sel, body: css.slice(start, i).trim(), media: depth === 2 ? media : '' }); sel = ''; depth--; }
      else { depth = Math.max(0, depth - 1); if (depth === 0) media = ''; }
      start = i + 1;
    }
  }
  return out;
}
const tally = (arr) => { const m = new Map(); for (const v of arr) m.set(v, (m.get(v) || 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };
const vars = []; const decl = { size: [], space: [], radius: [], shadow: [], dur: [], color: [] };
const stateRules = { Buttons: [], Chips: [], Cards: [], 'Form fields': [] };
const groups = {
  Buttons: /\.(button|pill|secondary|linkish|primary|btn|ghost|play|toggle)\b|\bbutton\b|#submit/,
  Chips: /\.(chip|tag|badge|ring|label|pip)\b/,
  Cards: /\.(card|sheet|way|tile|panel|film-card|step|metric)\b/,
  'Form fields': /\b(input|select|textarea)\b|#email|#consent|\.(field|form|check|consent)\b/,
};
for (const s of sources) {
  for (const r of rules(s.css)) {
    if (r.sel.includes(':root') || (s.varsOnly && /^\.dark\b/.test(r.sel))) {
      for (const m of r.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) vars.push({ src: s.name, sel: r.sel + (r.media ? ` (${r.media})` : ''), name: m[1], value: m[2].trim() });
    }
    if (s.varsOnly) continue;
    for (const m of r.body.matchAll(/(?:^|;)\s*([\w-]+)\s*:\s*([^;]+)/g)) {
      const [p, v] = [m[1], m[2].trim()];
      if (p === 'font-size') decl.size.push(v);
      if (p === 'font') { const f = v.match(/(\d+(?:\.\d+)?px|clamp\([^)]*\))(\/[\d.]+)?/); if (f) decl.size.push(f[1] + (f[2] || '')); }
      if (/^(padding|margin|gap|row-gap|column-gap)(-|$)/.test(p)) decl.space.push(...v.split(/\s+/).filter((x) => /^-?\d/.test(x) && x !== '0'));
      if (p === 'border-radius') decl.radius.push(v);
      if (p === 'box-shadow') decl.shadow.push(v);
      if (/^(transition|animation)(-duration)?$/.test(p)) decl.dur.push(...(v.match(/(var\(--[\w-]+\)|\d*\.?\d+m?s)\b/g) || []).filter((x) => /s$|var/.test(x) && !/^var\(--ease/.test(x)));
      for (const c of v.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || []) decl.color.push(c);
    }
    for (const [g, re] of Object.entries(groups)) {
      if (re.test(r.sel)) stateRules[g].push({ src: s.name, css: (r.media ? r.media + ' { ' : '') + `${r.sel}{${r.body}}` + (r.media ? ' }' : ''), state: /:(hover|focus|focus-visible|active|disabled|checked|invalid|focus-within)|\[aria-|\[disabled|\.(is-|on|active|open|sent|error|busy)/.test(r.sel) });
    }
  }
}
const isColor = (v) => /^#|^rgb|^hsl|^oklch/.test(v);
const swatch = (v) => `<span class="sw" style="background:${esc(v)}"></span>`;
const varTable = (list) => `<div class="table"><table><thead><tr><th>Token</th><th>Value</th><th>Source</th></tr></thead><tbody>${list.map((v) => `<tr><td><code>${esc(v.name)}</code></td><td>${isColor(v.value) ? swatch(v.value) : ''}<code>${esc(v.value)}</code></td><td>${esc(v.src)}<br><span class="muted">${esc(v.sel)}</span></td></tr>`).join('')}</tbody></table></div>`;
const tallyTable = (arr, head, color) => `<div class="table"><table><thead><tr><th>${head}</th><th>Uses</th></tr></thead><tbody>${tally(arr).map(([v, n]) => `<tr><td>${color ? swatch(v) : ''}<code>${esc(v)}</code></td><td>${n}</td></tr>`).join('')}</tbody></table></div>`;
const staticVars = vars.filter((v) => v.src !== 'Terms and methodology app');
const appVars = vars.filter((v) => v.src === 'Terms and methodology app');
const colorVars = staticVars.filter((v) => isColor(v.value));
const otherVars = staticVars.filter((v) => !isColor(v.value));
const pxNum = (v) => parseFloat(v) || 0;
const stateHtml = Object.entries(stateRules).map(([g, list]) => {
  const uniq = [...new Map(list.map((x) => [x.src + x.css, x])).values()];
  const base = uniq.filter((x) => !x.state), st = uniq.filter((x) => x.state);
  const block = (arr) => arr.length ? `<pre><code>${esc(arr.map((x) => `/* ${x.src} */ ${x.css}`).join('\n'))}</code></pre>` : '<p class="muted">None found.</p>';
  return `<h3 id="tokens-${g.toLowerCase().replace(/\s/g, '-')}">${g}</h3><h4>Resting</h4>${block(base)}<h4>States (hover, focus, active, disabled, checked, invalid and class toggles)</h4>${block(st)}`;
}).join('\n');

// ---------- Screenshots ----------
const PAGES = [['root', 'Root', '/'], ['explore', 'Explorer', '/explore/'], ['specimen', 'Specimen', '/explore/specimen.html'], ['film', 'Film page', '/explore/experience-film.html'], ['privacy', 'Privacy', '/privacy/'], ['methodology', 'Methodology', '/methodology'], ['terms', 'Terms', '/terms'], ['404', '404', '/this-page-does-not-exist']];
const shots = readdirSync(resolve(OUT, 'shots'));
const fig = (src, cap) => `<figure><a href="${src}"><img src="${src}" alt="${esc(cap)}" loading="lazy"></a><figcaption>${esc(cap)}</figcaption></figure>`;
const shotHtml = PAGES.map(([k, name, path]) => {
  const figs = [];
  for (const w of ['390', '1440']) {
    if (shots.includes(`${k}-${w}-fold.jpg`)) figs.push(fig(`shots/${k}-${w}-fold.jpg`, `${name} (${path}), ${w} px wide, first screen`));
    if (shots.includes(`${k}-${w}.jpg`)) figs.push(fig(`shots/${k}-${w}.jpg`, `${name} (${path}), ${w} px wide, full page`));
  }
  const secs = shots.filter((f) => f.startsWith(`${k}-`) && f.includes('-s-')).sort();
  const secFigs = secs.map((f) => { const [, w, , s] = f.replace('.jpg', '').split('-'); return fig(`shots/${f}`, `${name}, ${w} px wide, section: ${s}`); });
  return `<h3 id="shots-${k}">${name} <span class="muted">${esc(path)}</span></h3><div class="grid">${figs.join('')}</div>${secFigs.length ? `<details><summary>${name} sections, one image each</summary><div class="grid">${secFigs.join('')}</div></details>` : ''}`;
}).join('\n');

const oldDir = resolve(ROOT, 'docs/web-audit/old');
const oldShots = existsSync(oldDir) ? readdirSync(oldDir).filter((f) => f.endsWith('.jpg')).sort() : [];
for (const f of oldShots) copyFileSync(resolve(oldDir, f), resolve(OUT, 'old', f));
const oldLabel = { landing: 'Old brand landing (LandingV12)', gate: 'Old Coming Soon gate', plus: 'Old Plus page', start: 'Old start page', privacy: 'Old privacy page', terms: 'Old terms page', methodology: 'Old methodology page', 404: 'Old 404' };
const oldHtml = oldShots.map((f) => {
  const parts = f.replace('.jpg', '').split('-'); const w = parts[1]; const rest = parts.slice(2).join(' ') || 'full page';
  return fig(`old/${f}`, `${oldLabel[parts[0]] || parts[0]}, ${w} px wide, ${rest === 'fold' ? 'first screen' : rest}`);
}).join('');

copyFileSync(resolve(process.cwd(), 'public/static/img/wordmark.svg'), resolve(OUT, 'wordmark.svg'));

const docs = [['brand-inventory', 'Brand inventory', 'BRAND_INVENTORY.md'], ['design-notes', 'Design notes', 'DESIGN_NOTES.md'], ['site-diagnosis', 'Site diagnosis', 'SITE_DIAGNOSIS.md'], ['comparison', 'Comparison', 'docs/web-audit/COMPARISON.md']];
// The brief carries no em dashes; a quoted one in the sources is named instead.
const docHtml = docs.map(([id, title, file]) => `<section class="doc" id="${id}"><h2>${title} <span class="muted">${file}</span></h2>${md(readFileSync(resolve(ROOT, file), 'utf8').replace(/ ?— ?/g, ' [em dash] '), id)}</section>`).join('\n');

const date = new Date().toISOString().slice(0, 10);
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="googlebot" content="noindex,nofollow">
<title>AlgorithmLens design brief</title>
<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap">
<style>
:root{--ink:#3A3730;--dark:#1A1712;--paper:#F5F4F0;--card:#FFFFFF;--line:#DDD8CD;--muted:#6D685F;--blue:#1868D8;--green:#20A888}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:1200px;margin:0 auto;padding:32px 16px 96px}
h1,h2,h3{font-family:"Source Serif 4",Georgia,serif;font-weight:400;line-height:1.1}
h1{font-size:clamp(36px,5vw,56px);margin:0 0 12px}
h2{font-size:32px;margin:64px 0 16px;padding-top:24px;border-top:1px solid var(--line)}
h3{font-size:24px;margin:40px 0 12px}
h4,h5,h6{margin:24px 0 8px}
a{color:var(--blue)}
.muted{color:var(--muted);font-size:.7em;font-family:system-ui,sans-serif}
td .muted{font-size:12px}
nav.toc{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 24px;margin:24px 0}
nav.toc ol{margin:0;padding-left:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;align-items:start}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:8px}
figure img{display:block;width:100%;height:auto;max-height:900px;object-fit:cover;object-position:top;border-radius:6px}
figcaption{font-size:14px;color:var(--muted);padding:8px 4px 2px}
details{margin:12px 0}
summary{cursor:pointer;font-weight:600;padding:8px 0}
.table{overflow-x:auto;margin:12px 0}
table{border-collapse:collapse;background:var(--card);font-size:14px;min-width:100%}
th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
code{font:13px/1.4 ui-monospace,Consolas,monospace;word-break:break-word}
pre{background:var(--dark);color:#F5F4F0;padding:16px;border-radius:10px;overflow-x:auto;white-space:pre-wrap}
pre code{word-break:break-all}
.sw{display:inline-block;width:14px;height:14px;border:1px solid var(--line);border-radius:3px;vertical-align:-2px;margin-right:6px}
.note{background:var(--card);border:1px solid var(--line);border-left:4px solid var(--green);border-radius:10px;padding:16px 20px}
.wordmark{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:32px;display:flex;gap:32px;flex-wrap:wrap;align-items:center}
.wordmark img{height:48px;width:auto}
.doc{overflow-wrap:anywhere}
blockquote{margin:12px 0;padding:8px 16px;border-left:3px solid var(--line);color:var(--muted)}
</style>
</head>
<body>
<div class="wrap">
<h1>AlgorithmLens design brief</h1>
<p>An unlisted working brief for the site redesign. Built ${date} from the live site at <a href="${BASE}/">${BASE}/</a>. Every image opens full size when clicked.</p>
<nav class="toc" aria-label="Contents"><ol>
<li><a href="#shots">Live screenshots at 390 and 1440</a></li>
<li><a href="#old">Old site screenshots</a></li>
${docs.map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join('\n')}
<li><a href="#tokens">Token sheet from the live CSS</a></li>
<li><a href="#wordmark">Wordmark</a></li>
<li><a href="#v12">Landing v12 design</a></li>
<li><a href="#type">Headline typeface</a></li>
</ol></nav>

<section id="shots"><h2>Live screenshots</h2>
<p>Fresh captures of every live page with <code>scripts/web-audit/shoot-live.mjs</code> (Playwright, Chromium). 390 px is shot at 2x density with a mobile viewport; 1440 px at 1x. Full-page captures pin sticky headers so they do not smear. The root's record card is a sandboxed frame and can read blank in full-page captures; the section captures show it.</p>
${shotHtml}
</section>

<section id="old"><h2>Old site screenshots</h2>
<p>The Vite and React app at commit b9a1e192, run locally, from <code>docs/web-audit/old/</code>. The brand page was LandingV12 (landing); the page the public actually saw was the Coming Soon gate (gate).</p>
${oldShots.length ? `<details><summary>${oldShots.length} old site images</summary><div class="grid">${oldHtml}</div></details>` : '<p>None remain.</p>'}
</section>

${docHtml}

<section id="tokens"><h2>Token sheet from the live CSS</h2>
<p>Read on ${date} from these live stylesheets: ${sources.map((s) => `<a href="${esc(s.url)}">${esc(s.name)}</a>`).join(', ')}. The static pages (root, explorer, specimen, film, privacy, 404) share one hand-written canon; terms and methodology still run on the older React app, whose custom properties are listed separately at the end.</p>
<h3 id="tokens-colors">Colors, named</h3>${varTable(colorVars)}
<h3 id="tokens-colors-raw">Colors, literal values in rules</h3><details><summary>Every literal color used outside the named tokens</summary>${tallyTable(decl.color, 'Color', true)}</details>
<h3 id="tokens-other">Other named tokens (type families, motion, easing)</h3>${varTable(otherVars)}
<h3 id="tokens-type">Type scale</h3><p>Font sizes as written in rules, with line height where the shorthand sets one. Body is 17 px on 1.55. Headlines are serif at weight 400; h1 is <code>clamp(42px,5vw,68px)</code> on 1.02 with -1.8 px tracking, h2 is <code>clamp(32px,3.6vw,48px)</code> on 1.06 with -1.2 px tracking, h3 is 22 px on 1.2.</p>${tallyTable(decl.size.sort((a, b) => pxNum(b) - pxNum(a)), 'Size')}
<h3 id="tokens-space">Spacing</h3><p>Every length used in padding, margin and gap, by frequency. The page gutter is 24 px (16 px on the brief itself) inside a 1180 px column.</p>${tallyTable(decl.space, 'Length')}
<h3 id="tokens-radii">Radii</h3>${tallyTable(decl.radius, 'Radius')}
<h3 id="tokens-shadows">Shadows</h3>${tallyTable(decl.shadow, 'Shadow')}
<h3 id="tokens-motion">Motion durations</h3><p>The canon names three: tick 160 ms (hover and press), beat 240 ms (lifts and underlines), settle 400 ms (reveals), all on <code>cubic-bezier(.22,1,.36,1)</code>. Everything stops under reduced motion.</p>${tallyTable(decl.dur, 'Duration')}
<h3 id="tokens-states">Component states</h3><p>The rules as served, grouped by component. Resting rules first, then every state rule.</p>
${stateHtml}
<h3 id="tokens-app">Terms and methodology app custom properties</h3><details><summary>${appVars.length} properties from the older app bundle</summary>${varTable(appVars)}</details>
</section>

<section id="wordmark"><h2>Wordmark</h2>
<p>The wordmark as served on the live site, as an SVG file: <a href="wordmark.svg">wordmark.svg</a>. It is outlined paths, so it needs no font.</p>
<div class="wordmark"><img src="wordmark.svg" alt="AlgorithmLens wordmark"></div>
</section>

<section id="v12"><h2>Landing v12 design</h2>
<p>The approved v12 canon landing design, copied as it was saved from the design tool: <a href="landing-v12.html">landing-v12.html</a>. It is a saved snapshot, so some helper scripts it references are not present; the layout and copy render from its inline styles.</p>
</section>

<section id="type"><h2>Headline typeface</h2>
<div class="note"><p>Headlines use Source Serif 4, from Google Fonts: <a href="https://fonts.google.com/specimen/Source+Serif+4">fonts.google.com/specimen/Source+Serif+4</a>. Weight 400 roman for headlines, italic 400 for limits and captions. The live site self-hosts the same family in <code>/static/fonts/</code>; body text is the system sans stack.</p></div>
</section>
</div>
</body>
</html>
`;
writeFileSync(resolve(OUT, 'index.html'), page);
console.log('brief ->', resolve(OUT, 'index.html'), sources.length, 'css sources,', vars.length, 'vars,', oldShots.length, 'old shots');
