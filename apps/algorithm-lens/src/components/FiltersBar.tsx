import React from 'react';
import clsx from "clsx";
import { Platform } from "../lib/db";

export function FiltersBar({period,setPeriod,platforms,setPlatforms,refreshing,onRefresh}:{period:number;setPeriod:(d:number)=>void;platforms:Platform[];setPlatforms:(p:Platform[])=>void;refreshing:boolean;onRefresh:()=>void;}){
  const P=[7,30,90,9999];
  const PL:Platform[]=["instagram","tiktok","youtube","x","facebook","reddit"];
  const toggle=(p:Platform)=> setPlatforms(platforms.includes(p)?platforms.filter(x=>x!==p):[...platforms,p]);
  return (
    <div className="sticky top-16 z-30 bg-bg/80 backdrop-blur-md border-b border-line">
      <div className="max-w-[1120px] mx-auto px-6 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-inkMuted mr-2">Period:</span>
          {P.map(d=><button key={d} onClick={()=>setPeriod(d)} className={clsx("px-3 py-1 rounded-full border transition focus-visible:outline focus-visible:outline-2 outline-brand",
            period===d ? "bg-brand text-white border-brand" : "border-line text-ink hover:bg-white")}>{d===9999?"All":`${d}d`}</button>)}
          <span className="text-sm text-inkMuted ml-4 mr-2">Platforms:</span>
          {PL.map(p=><button key={p} onClick={()=>toggle(p)} className={clsx("px-3 py-1 rounded-full border transition capitalize focus-visible:outline focus-visible:outline-2 outline-brand",
            platforms.includes(p)?"bg-brand text-white border-brand":"border-line text-ink hover:bg-white")}>{p}</button>)}
        </div>
        <button onClick={onRefresh} className={clsx("px-3 py-1 rounded-full border focus-visible:outline focus-visible:outline-2 outline-brand", refreshing?"opacity-60":"hover:bg-white")}>
          {refreshing?"Refreshing…":"Refresh"}
        </button>
      </div>
    </div>
  );
}
