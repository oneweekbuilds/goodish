import { NormalizedItem } from "../db";

export function parseInstagramJSON(txt: string): NormalizedItem[] {
  const rows = JSON.parse(txt);
  const out: NormalizedItem[] = [];
  const push = (r:any, idx:number) => {
    const ts = (typeof r.timestamp === "string" ? new Date(r.timestamp).getTime() : (r.timestamp || Date.now()));
    const url = r.permalink || r.media_url || r.link || "";
    const text = r.caption || r.title || r.text || "";
    const id = url?.split("/").filter(Boolean).pop() || `ig_${idx}`;
    out.push({ id:`instagram:${ts}:${id}`, platform:"instagram" as const, timestamp:ts, contentId:id, text, url, topics:[] });
  };
  if (Array.isArray(rows)) rows.forEach(push);
  else if (rows?.likes) rows.likes.forEach(push);
  else if (rows?.reels_watched) rows.reels_watched.forEach(push);
  return out;
}
