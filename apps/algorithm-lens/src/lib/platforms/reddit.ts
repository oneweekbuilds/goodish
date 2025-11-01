import { NormalizedItem } from "../db";

export function parseRedditJSON(txt: string): NormalizedItem[] {
  const data = JSON.parse(txt);
  const out: NormalizedItem[] = [];
  const arr = Array.isArray(data) ? data : data.posts || data.history || [];
  arr.forEach((r:any, i:number)=>{
    const ts = new Date(r.created_utc ? r.created_utc*1000 : r.created || Date.now()).getTime();
    const text = r.title || r.body || r.selftext || "";
    const url = r.permalink ? `https://reddit.com${r.permalink}` : r.url || "";
    const id = r.id || url.split("/").pop() || `rd_${i}`;
    const author = r.author || r.subreddit;
    out.push({ id:`reddit:${ts}:${id}`, platform:"reddit" as const, timestamp:ts, contentId:id, creatorId:author, text, url, topics:[] });
  });
  return out;
}
