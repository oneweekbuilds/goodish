import { NormalizedItem } from "../db";

export function parseTikTokJSON(txt: string): NormalizedItem[] {
  const data = JSON.parse(txt);
  const lists = [
    data.VideoList, data["VideoList"], data["Video Browsing History"], data["Activity"]?.["Video Browsing History"]
  ].filter(Boolean)[0] || [];
  return lists.map((e:any, idx:number) => {
    const url = e.Link || e.link || e.URL || "";
    const ts = new Date(e.Date || e.date || e.Timestamp || Date.now()).getTime();
    const contentId = (url.split("/").pop() || `tt_${idx}`);
    return {
      id:`tiktok:${ts}:${contentId}`, platform:"tiktok" as const, timestamp:ts,
      contentId, url, text: e.Title || "", topics:[]
    };
  });
}
