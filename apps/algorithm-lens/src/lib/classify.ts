import { NormalizedItem } from "./db";

const TOPICS: Record<string,string[]> = {
  fitness:["workout","gym","run","glute","protein","cardio","deadlift"],
  politics:["election","vote","senate","president","policy","congress","bill"],
  wellness:["mindfulness","therapy","meditation","sleep","wellbeing","anxiety"],
  finance:["invest","stocks","budget","credit","savings","crypto","bitcoin"],
  entertainment:["movie","music","show","concert","trailer","stream"],
  tech:["ai","app","gadget","iphone","android","laptop","software","prompt"],
  beauty:["skincare","makeup","foundation","serum","routine"],
  relationships:["dating","relationship","marriage","attachment"],
};

const POS = ["love","great","amazing","awesome","win","helpful","beautiful","cool"];
const NEG = ["hate","terrible","toxic","bad","awful","fail","angry","sad","anxiety","scared"];
const AD  = ["#ad","sponsored","paid partnership","affiliate","use code","shop now","link in bio"];

export function classify(items: NormalizedItem[]): NormalizedItem[] {
  return items.map(i=>{
    const text=`${i.text||""} ${i.url||""}`.toLowerCase();
    const topics = new Set<string>();
    for (const [topic, kws] of Object.entries(TOPICS)) {
      if (kws.some(k=>text.includes(k))) topics.add(topic);
    }
    const pos=POS.some(k=>text.includes(k));
    const neg=NEG.some(k=>text.includes(k));
    const sentiment = pos && !neg ? "pos" : neg && !pos ? "neg" : "neu";
    const isAd = AD.some(k=>text.includes(k));
    return { ...i, topics:[...topics], sentiment, isAd };
  });
}
