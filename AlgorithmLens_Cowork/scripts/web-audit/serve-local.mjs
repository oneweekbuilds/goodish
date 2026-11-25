#!/usr/bin/env node
// A local stand-in for the Vercel deployment of public/, for previews and for
// the audit scripts in this folder. It applies vercel.json's redirects,
// rewrites and headers (so /terms, /methodology and the 404 page behave as
// they do live, and the pages run under the real Content-Security-Policy),
// serves directory indexes, and answers Range requests so the films load.
// The live host named in the /explore/ policy is swapped for this one;
// otherwise that policy would block the explorer's own assets on localhost.
//
// Usage: node scripts/web-audit/serve-local.mjs [port] [folder]     (default 5190, public)
// Then:  node scripts/web-audit/copy-check.mjs http://localhost:5190
//
// The folder is relative to the app root. Pass "dist" after `npm run build`
// to check the built site exactly as it will be deployed:
//   node scripts/web-audit/serve-local.mjs 5191 dist
import http from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', process.argv[3] || 'public');
const cfg = JSON.parse(readFileSync(path.resolve(here, '..', '..', 'vercel.json'), 'utf8'));
const port = Number(process.argv[2] || 5190);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// The source patterns vercel.json uses here: literal paths, "/(.*)" and ":path*".
function toRegex(source) {
  const escaped = source
    .replace(/[.+?^${}|[\]\\]/g, '\\$&')
    .replace(/\((?:\\\.)\*\)|\(\.\*\)/g, '(.*)')
    .replace(/:path\*/g, '(.*)');
  return new RegExp('^' + escaped + '$');
}
const redirects = (cfg.redirects || []).map((r) => ({ ...r, re: toRegex(r.source) }));
const rewrites = (cfg.rewrites || []).map((r) => ({ ...r, re: toRegex(r.source) }));
const headers = (cfg.headers || []).map((h) => ({ ...h, re: toRegex(h.source) }));

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(url.pathname);
  for (const r of redirects) {
    const m = p.match(r.re);
    if (m) {
      res.writeHead(r.statusCode || 308, { Location: r.destination.replace(':path*', m[1] || '') });
      res.end();
      return;
    }
  }
  const out = {};
  for (const h of headers) {
    if (!h.re.test(p)) continue;
    for (const kv of h.headers) out[kv.key] = kv.value.replace(/https:\/\/www\.algorithmlens\.com/g, 'http://localhost:' + port);
  }
  for (const r of rewrites) if (r.re.test(p)) p = r.destination;
  let file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  let status = 200;
  if (!existsSync(file)) { file = path.join(root, '404.html'); status = 404; }
  const stat = statSync(file);
  out['Content-Type'] = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
  out['Accept-Ranges'] = 'bytes';
  // A preview should always show the file on disk, never a cached copy.
  out['Cache-Control'] = 'no-store';
  const range = status === 200 && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    out['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    out['Content-Length'] = end - start + 1;
    res.writeHead(206, out);
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  out['Content-Length'] = stat.size;
  res.writeHead(status, out);
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} as the live site would, on http://localhost:${port}`));
