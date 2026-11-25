// The page that the site's long documents are set in: /methodology and /terms
// (scripts/build-paper-pages.mjs) and /privacy/ (scripts/build-legal-pages.mjs).
// One template, so the three cannot drift: the shared header and footer, the
// page head of the November 2026 facelift (a dateline over a thick and thin
// rule, then the headline), a contents list made from the document's own
// section headings, and the document column. Nothing here writes or changes
// document text; the generators pass their text in as `body`.

const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => escText(s).replace(/"/g, '&quot;');

/**
 * Gives every plain heading in a document body an id, and returns the list
 * of sections (the <h2> headings) for the contents list. The link text is
 * the heading's own text (its markup stripped); nothing is added or
 * reworded.
 */
export function withContents(body, taken = []) {
  const used = new Set(taken);
  const contents = [];
  const slug = (inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const base = text
      .replace(/&[#a-z0-9]+;/gi, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section';
    let id = base;
    for (let n = 2; used.has(id); n++) id = base + '-' + n;
    used.add(id);
    return { id, text };
  };
  // The section headings first, so their ids (which other pages link to) never depend on the headings inside them.
  let out = body.replace(/<h2>([\s\S]*?)<\/h2>/g, (all, inner) => {
    const { id, text } = slug(inner);
    contents.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  // Then every heading below them, so any passage of a document can be linked to. They do not join the contents list.
  out = out.replace(/<h([3-6])>([\s\S]*?)<\/h\1>/g, (all, level, inner) => `<h${level} id="${slug(inner).id}">${inner}</h${level}>`);
  return { body: out, contents };
}

// Tokens are canon/canon.json. Everything below the tokens is chrome shared
// with the other pages (header, footer) or the document layout.
const BASE_CSS = `@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-regular.woff2) format('woff2');font-weight:400;font-style:normal;font-display:swap}
@font-face{font-family:Source;src:url(/static/fonts/source-serif-4-italic.woff2) format('woff2');font-weight:400;font-style:italic;font-display:swap}
/* Until the serif arrives the page is set in Georgia, scaled to the serif's width (measured: roman 107.4%, italic 95.2%), so no line re-wraps when it swaps in. */
@font-face{font-family:"Source Fallback";src:local("Georgia");font-weight:400;font-style:normal;size-adjust:107.4%}
@font-face{font-family:"Source Fallback";src:local("Georgia Italic"),local("Georgia-Italic");font-weight:400;font-style:italic;size-adjust:95.2%}
:root{--paper:#F5F4F0;--panel:#FFFFFF;--field:#FFFDF9;--line:#DDD8CD;--mark:#E6E1D6;--muted:#6D685F;--ink:#3A3730;--ink-press:#141311;--blue:#1868D8;--blue-bg:#ECF3FC;--green:#20A888;--on-ink:#F7F5EF;--serif:Source,"Source Fallback",Georgia,"Times New Roman",serif;--sans:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif;--shadow-pill:0 6px 16px rgba(58,55,48,.18);--tick:160ms;--beat:240ms;--ease:cubic-bezier(.22,1,.36,1);--gutter:24px}
@media(min-width:600px){:root{--gutter:48px}}
@media(min-width:900px){:root{--gutter:clamp(48px,8.333vw,120px)}}
*{box-sizing:border-box}
html{scroll-padding-top:88px}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/26px var(--sans);-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
svg{display:block}
::selection{background:var(--mark)}
.wrap{max-width:1440px;margin:0 auto;padding:0 var(--gutter);width:100%}
a{color:var(--ink);text-underline-offset:4px;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--blue);outline-offset:3px}
.skip{position:absolute;left:-999px;top:8px;background:var(--ink);color:var(--on-ink);padding:12px 16px;border-radius:8px;z-index:30}
.skip:focus{left:8px}
.pill{display:inline-flex;align-items:center;justify-content:center;background:var(--ink);color:var(--on-ink);border-radius:22px;height:44px;padding:0 18px;font:600 15px/1 var(--sans);text-decoration:none;white-space:nowrap;transition:transform var(--tick) var(--ease),background var(--tick) var(--ease),box-shadow var(--tick) var(--ease)}
.pill:hover{background:var(--ink-press);transform:translateY(-1px);box-shadow:var(--shadow-pill)}
.pill:active{transform:translateY(1px);box-shadow:none}
.topbar{position:sticky;top:0;z-index:20;background:var(--paper);border-bottom:1px solid var(--line);transition:background var(--beat) var(--ease),box-shadow var(--beat) var(--ease)}
.topbar.scrolled{background:rgba(245,244,240,.86);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--line),0 8px 24px rgba(58,55,48,.06)}
header.top{display:flex;justify-content:space-between;align-items:center;gap:12px;height:64px;transition:height var(--beat) var(--ease)}
.brand{width:139px;min-width:96px;height:44px;display:flex;align-items:center;transition:width var(--beat) var(--ease)}
.brand svg{width:100%;height:auto}
.topnav{display:flex;align-items:center;gap:8px;margin-left:auto}
nav.sections{display:none;gap:32px;font-size:15px}
nav.sections a{position:relative;text-decoration:none;display:inline-flex;align-items:center;min-height:44px;padding:6px 0}
nav.sections a::after{content:"";position:absolute;left:0;right:0;bottom:8px;height:2px;background:var(--blue);transform:scaleX(0);transform-origin:left;transition:transform var(--beat) var(--ease)}
nav.sections a:hover::after,nav.sections a:focus-visible::after,nav.sections a[aria-current]::after{transform:scaleX(1)}
/* below 900 px the section links fold into a menu (a native disclosure, so it works without script) */
.menu summary{list-style:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;height:44px;min-width:44px;min-height:0;padding:0 14px;border:1px solid var(--line);border-radius:22px;background:var(--panel);color:var(--ink);font:600 14px/1 var(--sans);text-decoration:none;cursor:pointer;transition:border-color var(--tick) var(--ease)}
.menu summary::-webkit-details-marker{display:none}
.menu summary:hover,.menu[open] summary{border-color:var(--ink)}
.menu .bars{display:grid;gap:4px;width:16px}
.menu .bars i{display:block;height:2px;border-radius:1px;background:var(--ink)}
.menu nav{position:absolute;left:0;right:0;top:100%;display:flex;flex-direction:column;background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line);box-shadow:0 16px 24px rgba(58,55,48,.08);padding:4px var(--gutter) 12px}
.menu nav a{display:flex;align-items:center;min-height:52px;font:22px/28px var(--serif);text-decoration:none;border-top:1px solid var(--line)}
.menu nav a:first-child{border-top:0}
@media(max-width:399px){.menu summary{padding:0}.menu-word{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.topbar .pill{padding:0 13px;font-size:14px}}
@media(min-width:900px){.menu{display:none}}
@media(min-width:900px){header.top{gap:24px;height:72px}.topbar.scrolled header.top{height:64px}.brand{width:188px}.topbar.scrolled .brand{width:158px}nav.sections{display:flex}.topbar .pill{padding:0 20px;margin-left:8px}}
main{flex:1;padding:20px 0 72px}
.label{display:inline-flex;align-items:center;gap:8px;font-size:14px;line-height:18px;color:var(--muted)}
.label::before{content:"";width:12px;height:12px;border:1.5px solid var(--ink);border-radius:50%;flex-shrink:0}
.dateline{margin:0;padding-bottom:14px}
.oxford{height:6px;border-top:2px solid var(--ink);border-bottom:1px solid var(--ink)}
h1{font:400 clamp(40px,11vw,68px)/1 var(--serif);letter-spacing:-.022em;margin:24px 0 16px;text-wrap:balance}
.meta{color:var(--muted);font-size:14px;line-height:20px;margin:0 0 28px;max-width:70ch}
.doc{border-top:1px solid var(--line);padding-top:28px}
.toc{margin:0 0 40px}
.toc p{font-size:13px;line-height:18px;color:var(--muted);margin:0 0 10px}
.toc ol{list-style:none;margin:0;padding:0;border-bottom:1px solid var(--line)}
.toc li{break-inside:avoid}
.toc a{display:block;padding:12px 0;border-top:1px solid var(--line);font-size:14px;line-height:20px;text-decoration:none;overflow-wrap:normal;transition:padding-left var(--beat) var(--ease),box-shadow var(--beat) var(--ease)}
.toc a:hover{text-decoration:underline;text-decoration-color:var(--blue)}
.toc a[aria-current]{padding-left:12px;box-shadow:inset 2px 0 0 var(--ink)}
.paper{max-width:70ch}
.paper h2{font:400 clamp(28px,3vw,40px)/1.12 var(--serif);letter-spacing:-.015em;margin:52px 0 18px;padding-top:26px;border-top:1px solid var(--ink);text-wrap:balance}
.paper h3{font:400 24px/30px var(--serif);margin:32px 0 10px;text-wrap:balance}
.paper p{margin:0 0 16px}
.paper strong{font-weight:600}
@media(min-width:600px) and (max-width:1099px){.toc ol{column-count:2;column-gap:32px}}
@media(min-width:900px){main{padding:28px 0 104px}h1{font-size:clamp(60px,7vw,100px);margin:22px 0 18px}.meta{margin-bottom:36px}.doc{padding-top:40px}}
@media(min-width:1100px){
.doc{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px;align-items:start}
.toc{grid-column:1/span 3;position:sticky;top:96px;max-height:calc(100vh - 120px);overflow-y:auto;margin:0}
.paper{grid-column:5/span 8}
}
footer.bottom{background:var(--panel);border-top:1px solid var(--line);padding:44px 0 40px;color:var(--muted);font-size:14px;line-height:22px;margin-top:auto}
.colophon{font:italic clamp(28px,4.5vw,56px)/1.1 var(--serif);letter-spacing:-.02em;color:var(--ink);text-wrap:balance;margin:0 0 36px;padding-bottom:36px;border-bottom:1px solid var(--line)}
.foot-brand{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.foot-brand .brand{width:139px}
.foot-brand p{margin:0;font-size:15px;line-height:22px;color:var(--muted);max-width:360px}
.foot-cols{display:grid;grid-template-columns:1fr 1.4fr;gap:8px 16px}
.foot-col{display:flex;flex-direction:column;font-size:14px;line-height:28px}
.foot-col b{font-weight:600;color:var(--ink)}
.foot-col a{color:var(--ink);text-decoration:none;display:inline-flex;align-items:center;min-height:44px;line-height:20px}
.foot-col a:hover{text-decoration:underline;text-decoration-color:var(--blue);text-underline-offset:4px}
.foot-row{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-top:24px;padding-top:8px;border-top:1px solid var(--line);font-size:13px;min-height:52px}
@media(min-width:900px){footer.bottom{padding:72px 0 48px}.colophon{margin-bottom:56px;padding-bottom:56px}.foot-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:24px}.foot-brand{grid-column:1/span 4;gap:16px;margin:0}.foot-brand .brand{width:188px}.foot-cols{display:contents}.foot-col{font-size:15px;line-height:30px}.foot-col.product{grid-column:6/span 2}.foot-col.company{grid-column:8/span 3}.foot-col.legal{grid-column:11/span 2}.foot-row{margin-top:32px;padding-top:12px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important}.topbar.scrolled{-webkit-backdrop-filter:none;backdrop-filter:none;background:var(--paper)}.pill:hover{transform:none}}`;

/**
 * One document page.
 *   title, description, canonical: the head tags (title also becomes the headline)
 *   eyebrow: the ring label over the rule;  meta: the line under the headline
 *   contents: [{ id, text }] for the contents list (text is already HTML-safe)
 *   body: the document's HTML;  lead: optional HTML placed before it in the column
 *   css: extra styles for this document's own elements (lists, tables, callouts)
 *   comment: an HTML comment placed after the doctype (the "generated from" note)
 *   scripts: load /chrome.js for the header's scrolled state. /privacy/ is served
 *            under a policy that allows no script, so it passes false.
 */
export function documentPage({ title, description, canonical, eyebrow, meta, contents = [], body, lead = '', css = '', comment = '', scripts = true }) {
  const toc = contents.length > 1
    ? `<nav class="toc" aria-label="Contents">
<p>Contents</p>
<ol>
${contents.map((c) => `<li><a href="#${c.id}">${c.text}</a></li>`).join('\n')}
</ol>
</nav>
`
    : '';
  return `<!doctype html>
${comment ? comment + '\n' : ''}<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escAttr(title)} | AlgorithmLens</title>
<meta name="description" content="${escAttr(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="/static/img/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#F5F4F0">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="AlgorithmLens">
<meta property="og:title" content="${escAttr(title)} | AlgorithmLens">
<meta property="og:description" content="${escAttr(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://www.algorithmlens.com/static/img/og-home-2026-11.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The AlgorithmLens wordmark, the words See what is actually in your social media feed, Free iPhone app, in beta, and an example screen from the app that reads: About half of what you saw came from just five accounts.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(title)} | AlgorithmLens">
<meta name="twitter:description" content="${escAttr(description)}">
<meta name="twitter:image" content="https://www.algorithmlens.com/static/img/og-home-2026-11.png">
<link rel="preload" href="/static/fonts/source-serif-4-regular.woff2" as="font" type="font/woff2" crossorigin>
<style>
${BASE_CSS}
${css}
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
<details class="menu" id="menu">
<summary><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-word">Menu</span></summary>
<nav aria-label="Menu">
<a href="/#how">How it works</a>
<a href="/#report">The report</a>
<a href="/#privacy">Privacy</a>
<a href="/methodology">Methodology</a>
</nav>
</details>
<a class="pill" href="https://testflight.apple.com/join/7n7n3scz" rel="noopener noreferrer">Join the beta</a>
</div>
</header>
</div></div>
<main id="main"><div class="wrap">
<div class="pagehead">
<p class="dateline"><span class="label">${escText(eyebrow)}</span></p>
<div class="oxford" aria-hidden="true"></div>
<h1>${escText(title)}</h1>
<p class="meta">${escText(meta)}</p>
</div>
<div class="doc">
${toc}<div class="paper">
${lead}${body}
</div>
</div>
</div></main>
<footer class="bottom">
<div class="wrap">
<p class="colophon">A scan reads what appeared. It cannot say why.</p>
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
<div class="foot-row"><span>&copy; 2026 AlgorithmLens</span></div>
</div>
</footer>
${scripts ? '<script src="/chrome.js"></script>\n' : ''}</body>
</html>
`;
}
