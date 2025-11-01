import { unzip } from "./unzip";
import { NormalizedItem, Platform } from "./db";
import { parseTikTokJSON } from "./platforms/tiktok";
import { parseInstagramJSON } from "./platforms/instagram";
import { parseYouTubeWatchHistory } from "./platforms/youtube";
import { parseXArchiveJS } from "./platforms/x_twitter";
import { parseFacebookJSON } from "./platforms/facebook";
import { parseRedditJSON } from "./platforms/reddit";

function stripBOM(s: string){ return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s; }

// CSV parsing - flexible column mapping with proper quote handling
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
}

function parseCSV(text: string, filename: string): NormalizedItem[] {
  const lines = stripBOM(text).split('\n').filter(line => line.trim());
  if (lines.length < 2) return []; // Need at least header + 1 row
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const items: NormalizedItem[] = [];
  
  // Try to detect platform from filename or headers
  const lowerFilename = filename.toLowerCase();
  let platform: Platform = 'instagram'; // default
  if (lowerFilename.includes('twitter') || lowerFilename.includes('x') || lowerFilename.includes('tweet')) platform = 'x';
  else if (lowerFilename.includes('tiktok')) platform = 'tiktok';
  else if (lowerFilename.includes('youtube')) platform = 'youtube';
  else if (lowerFilename.includes('facebook')) platform = 'facebook';
  else if (lowerFilename.includes('reddit')) platform = 'reddit';
  
  // Find column indices
  const textIdx = headers.findIndex(h => h.includes('text') || h.includes('content') || h.includes('caption') || h.includes('body') || h.includes('title'));
  const timestampIdx = headers.findIndex(h => h.includes('timestamp') || h.includes('date') || h.includes('created') || h.includes('time'));
  const urlIdx = headers.findIndex(h => h.includes('url') || h.includes('link') || h.includes('permalink'));
  const idIdx = headers.findIndex(h => h.includes('id') && !h.includes('user') && !h.includes('author'));
  const platformIdx = headers.findIndex(h => h === 'platform');
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
    if (values.length < headers.length) continue;
    
    const text = textIdx >= 0 ? values[textIdx] || '' : '';
    const timestampStr = timestampIdx >= 0 ? values[timestampIdx] : '';
    const url = urlIdx >= 0 ? values[urlIdx] || '' : '';
    const contentId = idIdx >= 0 ? values[idIdx] || `csv_${i}` : `csv_${i}`;
    const detectedPlatform = platformIdx >= 0 && values[platformIdx] ? (values[platformIdx].toLowerCase() as Platform) : platform;
    
    // Parse timestamp
    let timestamp = Date.now();
    if (timestampStr) {
      const parsed = new Date(timestampStr).getTime();
      if (!isNaN(parsed)) timestamp = parsed;
    }
    
    const itemId = `${detectedPlatform}:${timestamp}:${contentId}`;
    items.push({
      id: itemId,
      platform: detectedPlatform,
      timestamp,
      contentId,
      url,
      text,
      topics: [],
    });
  }
  
  return items;
}

export async function parseAnyFile(name: string, bytes: Uint8Array): Promise<NormalizedItem[]> {
  const lower = name.toLowerCase();

  // ZIP archives — scan inside for known files
  if (lower.endsWith(".zip")) {
    const { files, toText } = unzip(bytes);
    for (const [path, buf] of Object.entries(files)) {
      const p = path.toLowerCase();
      const txt = toText(buf);
      if (p.includes("watch-history.json")) return parseYouTubeWatchHistory(stripBOM(txt));
      if (p.includes("videolist") || p.includes("browsing") || p.includes("tiktok")) return parseTikTokJSON(stripBOM(txt));
      if (p.includes("likes") || p.includes("reels_watched") || p.includes("stories_seen") || p.includes("instagram")) return parseInstagramJSON(stripBOM(txt));
      if (p.includes("tweets.js") || p.includes("tweet.js")) return parseXArchiveJS(txt); // JS, not JSON
      if (p.includes("your_posts") || p.includes("posts") || p.includes("videos_watched") || p.includes("facebook")) return parseFacebookJSON(stripBOM(txt));
      if (p.includes("reddit")) return parseRedditJSON(stripBOM(txt));
    }
    return [];
  }

  // Single files
  const text = new TextDecoder().decode(bytes);
  
  // CSV files
  if (lower.endsWith(".csv")) {
    return parseCSV(text, name);
  }
  
  if (lower.endsWith(".js") && (lower.includes("tweet") || lower.includes("twitter"))) {
    return parseXArchiveJS(text);
  }
  if (lower.includes("watch-history")) return parseYouTubeWatchHistory(stripBOM(text));
  if (lower.includes("tiktok")) return parseTikTokJSON(stripBOM(text));
  if (lower.includes("facebook") || lower.includes("your_posts")) return parseFacebookJSON(stripBOM(text));
  if (lower.includes("reddit")) return parseRedditJSON(stripBOM(text));
  // default to Instagram JSON
  return parseInstagramJSON(stripBOM(text));
}
