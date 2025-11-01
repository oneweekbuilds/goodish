import { db, Platform } from "./db";

export async function getItemsInRange(days:number, platforms?:Platform[]){
  const now=Date.now(), from=now-days*24*3600*1000;
  const items = await db.items.where("timestamp").above(from).toArray();
  return platforms?.length ? items.filter(i=>platforms.includes(i.platform)) : items;
}

export async function topicShares(days=30, platforms?:Platform[]){
  const items = await getItemsInRange(days, platforms);
  const counts: Record<string, number> = {};
  items.forEach(i=>i.topics.forEach(t=>counts[t]=(counts[t]||0)+1));
  const total = items.length || 1;
  return Object.entries(counts).map(([topic,n])=>({topic, pct: n/total*100, n})).sort((a,b)=>b.pct-a.pct);
}

export async function sentimentSeries(bucket:"week"|"month"|"import"="week", platforms?:Platform[]){
  const items = await getItemsInRange(365, platforms);
  const fmt=(d:Date)=>d.toISOString().slice(0,10);
  const buckets: Record<string,{pos:number;neu:number;neg:number;total:number}> = {};
  for (const i of items){
    let key:string;
    if (bucket==="week"){
      const d=new Date(i.timestamp); const first=new Date(d); first.setDate(d.getDate()-d.getDay());
      key=fmt(first);
    } else if (bucket==="month"){
      const d=new Date(i.timestamp); key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-01`;
    } else key = String(i.timestamp); // per-item fallback
    const b=buckets[key]||(buckets[key]={pos:0,neu:0,neg:0,total:0});
    b[i.sentiment||"neu"]++; b.total++;
  }
  return Object.entries(buckets).sort(([a],[b])=>a<b?-1:1).map(([date,v])=>({date,...v}));
}

export function echoScoreFromShares(shares:{pct:number}[]){
  const p=shares.map(s=>s.pct/100);
  const h=p.reduce((acc,x)=>acc+x*x,0);
  return Math.round(h*100); // 0=diverse, 100=concentrated
}

export async function adRatio(days=30, platforms?:Platform[]){
  const items=await getItemsInRange(days, platforms);
  const ads=items.filter(i=>i.isAd).length;
  return Math.round((ads/(items.length||1))*100);
}

export async function topCreators(days=30, platforms?:Platform[]){
  const items=await getItemsInRange(days, platforms);
  const counts:Record<string,number>={};
  for (const i of items){
    const k=i.creatorId||"Unknown";
    counts[k]=(counts[k]||0)+1;
  }
  return Object.entries(counts).map(([creator,count])=>({creator,count})).sort((a,b)=>b.count-a.count).slice(0,10);
}
