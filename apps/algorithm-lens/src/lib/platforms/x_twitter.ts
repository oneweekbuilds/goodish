import { NormalizedItem } from "../db";

// Twitter/X archive: window.YTD.tweets.part0 = [ { tweet: {...} }, ... ]
export function parseXArchiveJS(jsText: string): NormalizedItem[] {
  // Find first '[' to strip "window.YTD.* = "
  const idx = jsText.indexOf("[");
  if (idx === -1) return [];
  const arr = JSON.parse(jsText.slice(idx));
  const out: NormalizedItem[] = [];
  arr.forEach((wrap: any, i: number) => {
    const t = wrap.tweet || wrap.favorite?.tweet || wrap;
    const ts = new Date(t.created_at || Date.now()).getTime();
    const text = t.full_text || t.text || "";
    const id = t.id_str || t.id || `tw_${i}`;
    const url = `https://twitter.com/i/web/status/${id}`;
    out.push({ id:`x:${ts}:${id}`, platform:"x", timestamp:ts, contentId:id, text, url, topics:[] });
  });
  return out;
}
