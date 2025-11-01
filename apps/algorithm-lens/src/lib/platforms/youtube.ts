import { NormalizedItem } from "../db";

export function parseYouTubeWatchHistory(txt: string): NormalizedItem[] {
  const rows = JSON.parse(txt);
  return rows.map((r:any, i:number) => {
    const ts = new Date(r.time || Date.now()).getTime();
    const url = r.titleUrl || "";
    const title = r.title || "";
    const channel = Array.isArray(r.subtitles) && r.subtitles[0]?.name || r.subtitles?.name;
    const id = url.includes("v=") ? url.split("v=").pop()!.split("&")[0] : `yt_${i}`;
    return { id:`youtube:${ts}:${id}`, platform:"youtube" as const, timestamp:ts, contentId:id, creatorId:channel, text:title, url, topics:[] };
  });
}
