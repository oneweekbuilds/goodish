#!/usr/bin/env node
// Renders the app's privacy policy (mobile/legal/PRIVACY_POLICY.md) as a
// static page in the site's field system, so the website and the app show
// one text. The policy wording is not changed; only its Markdown is turned
// into HTML and its em dashes (which the site's copy rules forbid) become
// colons after a bold lead-in and commas elsewhere.
//
// Usage: node scripts/build-legal-pages.mjs [path/to/PRIVACY_POLICY.md] [out.html]
// The policy lives in the mobile repository, a separate checkout. The source
// is found in this order:
//   1. the first argument, if given;
//   2. legal/PRIVACY_POLICY.md under the folder named by the environment
//      variable ALGLENS_MOBILE_REPO;
//   3. legal/PRIVACY_POLICY.md under the usual local checkout
//      (C:\Users\jwjwi\Desktop\AlgorithmLens_ParentFolder\AlgorithmLens_Cowork\mobile),
//      when that folder exists.
// If none of these exists the script stops with a message rather than writing
// a page from nothing. Output defaults to public/privacy/index.html.
//
// The page it is set in (header, footer, page head, contents list, document
// column) is the shared document template in scripts/paper-document.mjs, the
// same one /methodology and /terms use. /privacy/ is served under a policy
// that allows no script, so this page loads none.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { documentPage, withContents } from './paper-document.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const POLICY_REL = path.join('legal', 'PRIVACY_POLICY.md');
const LOCAL_MOBILE_REPO = 'C:/Users/jwjwi/Desktop/AlgorithmLens_ParentFolder/AlgorithmLens_Cowork/mobile';

function resolveSource() {
  if (process.argv[2]) return process.argv[2];
  const envRepo = process.env.ALGLENS_MOBILE_REPO;
  if (envRepo) return path.join(envRepo, POLICY_REL);
  if (existsSync(LOCAL_MOBILE_REPO)) return path.join(LOCAL_MOBILE_REPO, POLICY_REL);
  console.error(
    'build-legal-pages: cannot find the mobile repository. Set ALGLENS_MOBILE_REPO to the ' +
    'mobile checkout, or pass its legal/PRIVACY_POLICY.md as the first argument. ' +
    `The usual local checkout (${LOCAL_MOBILE_REPO}) does not exist.`
  );
  process.exit(1);
}

const src = resolveSource();
const out = process.argv[3] || path.join(here, '..', 'public', 'privacy', 'index.html');
if (!existsSync(src)) {
  console.error(`build-legal-pages: no policy at ${src}. Check ALGLENS_MOBILE_REPO or pass the mobile repository's legal/PRIVACY_POLICY.md as the first argument.`);
  process.exit(1);
}

// Editor notes written as HTML comments in the Markdown are not policy text.
const md = readFileSync(src, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const lines = md.split(/\r?\n/);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function inline(s) {
  let t = esc(s);
  // Em dashes: a colon after a bold lead-in, a comma elsewhere.
  t = t.replace(/\*\*\s+—\s+/g, '**: ').replace(/\s+—\s+/g, ', ').replace(/—/g, ', ');
  t = t.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
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
  if ((m = line.match(/^\d+\. (.+)/))) {
    if (inList !== 'ol') {
      closeList();
      // Numbered steps separated by blank lines are one list, not several.
      if (body[body.length - 1] === '</ol>') body.pop(); else body.push('<ol>');
      inList = 'ol';
    }
    body.push(`<li>${inline(m[1])}</li>`); i++; continue;
  }
  if (line.startsWith('> ')) { closeList(); const q = []; while (i < lines.length && lines[i].startsWith('>')) { q.push(lines[i].replace(/^>\s?/, '')); i++; } body.push(`<blockquote>${inline(q.join(' '))}</blockquote>`); continue; }
  // paragraph: gather consecutive plain lines
  closeList();
  const para = [];
  while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#|- |\d+\. |\||---|> )/.test(lines[i])) { para.push(lines[i]); i++; }
  body.push(`<p>${inline(para.join(' '))}</p>`);
}
closeList();

const updated = ((md.match(/\*\*Last Updated:\*\*\s*([^\r\n]+)/) || [])[1] || '').trim();

// Styles for what the policy contains: the site note, ordinary lists, the
// rules the Markdown draws between sections, the retention table.
const LEGAL_CSS = `.site-note{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:0 0 28px}
.site-note h2{border-top:0;padding-top:0;margin:0 0 10px;font-size:26px;line-height:32px;letter-spacing:0}
.site-note p{margin:8px 0}
.site-note p:last-child{margin-bottom:0}
.paper ul,.paper ol{margin:0 0 16px;padding-left:22px}
.paper li{margin:0 0 8px}
.paper hr{border:0;border-top:1px solid var(--ink);margin:52px 0 0}
.paper hr+h2{border-top:0;margin-top:0}
.paper hr+p{margin-top:24px}
.table-wrap{overflow-x:auto;max-width:100%;margin:12px 0 16px}
table{border-collapse:collapse;width:100%;font-size:15px;line-height:23px}
td,th{min-width:12ch}
th,td{text-align:left;vertical-align:top;padding:10px 12px 10px 0;border-bottom:1px solid var(--line)}
th{font-weight:600}
blockquote{margin:16px 0;padding:12px 16px;border-left:2px solid var(--line);color:var(--muted)}
code{font-family:ui-monospace,monospace;font-size:14px;overflow-wrap:anywhere}`;

// The note about this website is the site's own text, not the policy's; it
// sits first in the document column and first in the contents list.
const SITE_NOTE = `<section class="site-note" aria-labelledby="site-note-title">
<h2 id="site-note-title">This website</h2>
<p>The pages on algorithmlens.com set no cookies, run no analytics, and request nothing from third parties. The only data they send anywhere is the launch-list form: when you submit it, your email address and your consent are sent to our launch-list service (a function hosted for us by Supabase) and stored there so that we can send launch news. Nothing is sent until you press the button, and nothing is saved if the service reports a failure.</p>
<p>Your address is used only for launch news and is never sold or shared. To be removed from the list, write to <a href="mailto:privacy@algorithmlens.com">privacy@algorithmlens.com</a> from the address you signed up with.</p>
<p>The example scans shown on this site are fictional. Nothing on this site records your screen or reads your feed.</p>
</section>
`;

const sections = withContents(body.join('\n'), ['site-note-title']);
const html = documentPage({
  title,
  description: 'What AlgorithmLens collects, how a scan is processed and deleted, and your rights over your data. The same text the app shows.',
  canonical: 'https://www.algorithmlens.com/privacy/',
  eyebrow: 'Privacy policy',
  meta: `Last updated ${updated}. This is the same text the AlgorithmLens app shows in Settings.`,
  contents: [{ id: 'site-note-title', text: 'This website' }, ...sections.contents],
  lead: SITE_NOTE,
  body: sections.body,
  css: LEGAL_CSS,
  comment: '<!-- Generated from mobile/legal/PRIVACY_POLICY.md by scripts/build-legal-pages.mjs. Do not edit by hand; re-run the script. -->',
  scripts: false,
});

mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes, from', src, '(last updated', updated + ')');
