import { NormalizedItem } from "../db";

// Facebook takeout has many folders. We'll parse generic "your_posts" and "videos_watched" structures.
export function parseFacebookJSON(txt: string): NormalizedItem[] {
  const data = JSON.parse(txt);
  const out: NormalizedItem[] = [];
  const push = (ts:any, text:any, url:any, idx:number) => {
    const t = (typeof ts === "string" ? new Date(ts).getTime() : (ts || Date.now()));
    const id = url?.split("/").filter(Boolean).pop() || `fb_${idx}`;
    out.push({ id:`facebook:${t}:${id}`, platform:"facebook" as const, timestamp:t, contentId:id, text:text||"", url:url||"", topics:[] });
  };
  if (Array.isArray(data)) {
    data.forEach((r:any, i:number) => push(r.timestamp || r.created_timestamp || r.creation_timestamp, r.title || r.data?.[0]?.post || r.data?.[0]?.comment?.comment, r.uri || r.attachments?.[0]?.data?.[0]?.external_context?.url, i));
  } else if (data?.videos_watched) {
    data.videos_watched.forEach((v:any, i:number)=> push(v.timestamp, v.title, v.url, i));
  }
  return out;
}
