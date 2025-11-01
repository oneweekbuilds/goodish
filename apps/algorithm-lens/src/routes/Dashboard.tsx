import { useState, useEffect } from "react";
import { useDataStore, Platform } from "../lib/db";
import { FiltersBar } from "../components/FiltersBar";
import { KPIGrid } from "../components/KPIGrid";
import { TopicDonut } from "../components/TopicDonut";
import { SentimentTrend } from "../components/SentimentTrend";
import { TrendComparison } from "../components/TrendComparison";
import { RadialTile } from "../components/RadialTile";
import { TopCreators } from "../components/TopCreators";
import { ImportLog } from "../components/ImportLog";
import { FileDropZone } from "../components/FileDropZone";
import { Skeleton } from "../components/Skeleton";
import { topicShares, sentimentSeries, echoScoreFromShares, adRatio, topCreators, getItemsInRange } from "../lib/summarize";
import { importFile } from "../lib/importer";
import { connectFolder, scanForArchives, readFile, fsSupported } from "../lib/fs";
import { FolderOpen, Sparkles } from "lucide-react";

export function Dashboard({onToast}:{onToast:(msg:string,type:"success"|"error"|"info")=>void}){
  const [period, setPeriod] = useState(30);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get data from Zustand store (reactive)
  const items = useDataStore((state) => state.items);
  const isPremium = useDataStore((state) => state.isPremium);
  const setPremium = useDataStore((state) => state.setPremium);

  // Summary data
  const [topicData, setTopicData] = useState<{topic:string;pct:number;n:number}[]>([]);
  const [sentimentData, setSentimentData] = useState<{date:string;pos:number;neu:number;neg:number;total:number}[]>([]);
  const [trendData, setTrendData] = useState<{date:string;[topic:string]:any}[]>([]);
  const [trendTopics, setTrendTopics] = useState<string[]>([]);
  const [echo, setEcho] = useState(0);
  const [adPct, setAdPct] = useState(0);
  const [creators, setCreators] = useState<{creator:string;count:number}[]>([]);

  // Calculate stats from items
  const totalItems = items.length;
  const platformSet = new Set(items.map(i => i.platform));
  const topicSet = new Set<string>();
  items.forEach(i => i.topics.forEach(t => topicSet.add(t)));

  const platformCount = platformSet.size;
  const topicCount = topicSet.size;

  // Refresh summaries
  const refresh = async ()=>{
    setLoading(true);
    try {
      const days = period === 9999 ? 3650 : period;
      const plats = platforms.length ? platforms : undefined;

      const [topics, sentiment, echoScore, adR, creatorsData] = await Promise.all([
        topicShares(days, plats),
        sentimentSeries("week", plats),
        topicShares(days, plats).then(echoScoreFromShares),
        adRatio(days, plats),
        topCreators(days, plats),
      ]);

      setTopicData(topics);
      setSentimentData(sentiment);
      setEcho(100 - echoScore); // invert for "diversity score"
      setAdPct(adR);
      setCreators(creatorsData);

      // Trend data: count per topic per week
      const items = await getItemsInRange(days, plats);
      const allTopics = Array.from(new Set(items.flatMap(i=>i.topics)));
      setTrendTopics(allTopics);

      const buckets: Record<string, Record<string,number>> = {};
      items.forEach(i=>{
        const d = new Date(i.timestamp);
        const first = new Date(d);
        first.setDate(d.getDate() - d.getDay());
        const key = first.toISOString().slice(0,10);
        if(!buckets[key]) buckets[key] = {};
        i.topics.forEach(t=>{
          buckets[key][t] = (buckets[key][t]||0)+1;
        });
      });
      const trend = Object.entries(buckets).sort(([a],[b])=>a<b?-1:1).map(([date,counts])=>({date,...counts}));
      setTrendData(trend);
    } catch(e){
      onToast(`Error refreshing: ${(e as Error).message}`,"error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    refresh();
  },[period, platforms.length, items.length]); // React to items changes

  // Manual upload
  const handleFiles = async (files:File[])=>{
    setRefreshing(true);
    let added=0, skipped=0;
    try {
      for (const f of files){
        const bytes = new Uint8Array(await f.arrayBuffer());
        const res = await importFile(f.name, bytes);
        added+=res.added;
        skipped+=res.skipped;
      }
      onToast(`✅ ${added} items analyzed in ${files.length} file(s)`,"success");
      await refresh();
    } catch(e){
      onToast(`⚠️ Couldn't parse files. Check our supported file list.`,"error");
    } finally {
      setRefreshing(false);
    }
  };

  // Smart Import (File System Access API)
  const handleConnectFolder = async ()=>{
    if(!fsSupported){
      onToast("File System Access API not supported in this browser","error");
      return;
    }
    try {
      const dir = await connectFolder();
      const archives = await scanForArchives(dir);
      if(!archives.length){
        onToast("No supported archives found in this folder","info");
        return;
      }
      setRefreshing(true);
      let added=0;
      for (const handle of archives){
        const {name, bytes} = await readFile(handle);
        const res = await importFile(name, bytes);
        added+=res.added;
      }
      onToast(`✅ ${added} items from ${archives.length} archive(s)`,"success");
      await refresh();
    } catch(e){
      onToast(`Error: ${(e as Error).message}`,"error");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <FiltersBar period={period} setPeriod={setPeriod} platforms={platforms} setPlatforms={setPlatforms} refreshing={refreshing} onRefresh={refresh}/>

      <div className="max-w-[1120px] mx-auto px-6 md:px-8 py-6 space-y-6">
        {/* Dev Premium Toggle */}
        <div className="flex items-center justify-end gap-2 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPremium}
              onChange={(e) => setPremium(e.target.checked)}
              className="w-4 h-4 rounded border-line"
            />
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-inkMuted">Dev: Premium Mode</span>
          </label>
        </div>

        {/* Upload */}
        <div className="grid md:grid-cols-2 gap-4">
          <FileDropZone onFiles={handleFiles}/>
          {fsSupported && (
            <button onClick={handleConnectFolder} className="border-2 border-dashed border-[#e9e5dc] rounded-2xl p-8 text-center hover:border-[#01B1C0] transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#01B1C0]">
              <FolderOpen className="mx-auto mb-4 text-[#5b5f6a]" size={48}/>
              <p className="text-[#0e0f11] font-semibold mb-2">Smart Import: Connect Folder</p>
              <p className="text-sm text-[#5b5f6a]">Automatically scan a folder for new archives</p>
            </button>
          )}
        </div>

        {/* Total Media Analyzed - New Metric Tile */}
        <div className="rounded-2xl border border-line bg-panel shadow-e1 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-ink">{totalItems.toLocaleString()}</div>
              <div className="text-sm text-inkMuted mt-1">
                Total Media Analyzed
                {period === 9999 ? (
                  <span className="ml-2 text-xs">(All time)</span>
                ) : (
                  <span className="ml-2 text-xs">(Last {period} days)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <KPIGrid items={totalItems} platformCount={platformCount} topicCount={topicCount}/>

        {/* Import Log */}
        <ImportLog/>

        {/* Charts */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64"/>
            <Skeleton className="h-64"/>
          </div>
        ):(
          <>
            <div className="grid md:grid-cols-2 gap-8">
              <TopicDonut data={topicData}/>
              <SentimentTrend data={sentimentData}/>
            </div>

            <TrendComparison data={trendData}/>

            <div className="grid md:grid-cols-3 gap-4">
              <RadialTile label="Diversity Score" value={echo} color="#01B1C0"/>
              <RadialTile label="Ad Ratio" value={adPct} color="#eb5757"/>
              <div className="rounded-2xl border border-[#e9e5dc] bg-white shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col items-center justify-center">
                <div className="text-2xl font-semibold">{creators.length}</div>
                <div className="text-sm text-[#5b5f6a] text-center">Unique Creators</div>
              </div>
            </div>

            <TopCreators data={creators}/>
          </>
        )}
      </div>
    </div>
  );
}
