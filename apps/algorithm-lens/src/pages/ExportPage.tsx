import { useState, useRef, DragEvent } from "react";
import { Link, Navigate } from "react-router-dom";

type FeedItem = Record<string, unknown>;
type Parsed = { ok: true; items: FeedItem[] } | { ok: false; error: string };

const LS_KEY = "algorithmlens:data:v1";

/** naive CSV -> array of objects (first row = headers) */
function parseCSV(csv: string): Parsed {
  try {
    const lines = csv
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);
    if (lines.length < 2) return { ok: false, error: "CSV appears empty." };

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const items: FeedItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      // Simple split; handles basic quoted commas but not all edge cases
      const cols = row.match(/("([^"]|"")*"|[^,]+)/g)?.map(v => v.replace(/^"|"$/g, "").replace(/""/g, "\"")) ?? [];
      const obj: FeedItem = {};
      headers.forEach((h, idx) => (obj[h] = cols[idx] ?? ""));
      items.push(obj);
    }
    return { ok: true, items };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "CSV parse error." };
  }
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.readAsText(file);
  });
}

function parseAny(text: string, filename: string): Parsed {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".json")) {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : (data?.items ?? []);
      if (!Array.isArray(items)) return { ok: false, error: "JSON does not contain an array." };
      return { ok: true, items };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Invalid JSON." };
    }
  }
  if (lower.endsWith(".csv")) return parseCSV(text);
  // Fallback: try JSON first, then CSV
  try { return { ok: true, items: JSON.parse(text) }; } catch { /* ignore */ }
  return parseCSV(text);
}

export default function ExportPage() {
  const [status, setStatus] = useState<"idle" | "parsing" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [redirect, setRedirect] = useState<boolean>(false);
  const [lastFilename, setLastFilename] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function ingestText(text: string, sourceName: string) {
    setStatus("parsing");
    setError(null);
    const parsed = parseAny(text, sourceName);
    if (!parsed.ok) {
      setStatus("idle");
      setError(parsed.error);
      return;
    }

    // Persist where Dashboard expects it
    const payload = { items: parsed.items, meta: { source: sourceName, importedAt: new Date().toISOString() } };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));

    setCount(parsed.items.length);
    setLastFilename(sourceName);
    setStatus("saved");
  }

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const text = await readFileAsText(file);
    await ingestText(text, file.name);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    onFiles(e.dataTransfer?.files ?? null);
  }

  function onBrowse() {
    inputRef.current?.click();
  }

  async function loadSample() {
    try {
      // Try public directory first (works in Vite)
      const res = await fetch("/sample-data/sampleFeed.json");
      if (!res.ok) throw new Error("Not found");
      const text = await res.text();
      await ingestText(text, "sampleFeed.json");
    } catch (e) {
      // Fallback: try src path or use inline data
      const sampleData = [
        {
          id: "post_001",
          platform: "instagram",
          timestamp: "2025-01-01T12:00:00Z",
          author: "creator_a",
          content: "morning workout tips",
          categories: ["fitness", "health"],
          is_ad: false
        },
        {
          id: "post_002",
          platform: "tiktok",
          timestamp: "2025-01-02T15:10:00Z",
          author: "brand_b",
          content: "new shoes launch",
          categories: ["shopping", "fashion"],
          is_ad: true
        },
        {
          id: "post_003",
          platform: "youtube",
          timestamp: "2025-01-03T20:30:00Z",
          author: "chef_c",
          content: "quick high-protein dinner",
          categories: ["cooking", "nutrition"],
          is_ad: false
        }
      ];
      await ingestText(JSON.stringify(sampleData), "sampleFeed.json");
    }
  }

  if (redirect) return <Navigate to="/dashboard" replace />;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Import your data</h1>
      <p className="text-muted-foreground mb-8">
        Upload a <span className="font-medium">JSON</span> or <span className="font-medium">CSV</span> export of your feed.
        We process locally and store it in your browser. Your data never leaves your device.
      </p>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <label
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/40"
        >
          <div className="text-xl font-semibold">Drag & drop your file here</div>
          <div className="text-sm text-muted-foreground">or</div>
          <button
            type="button"
            onClick={onBrowse}
            className="rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadSample}
            className="rounded-lg px-3 py-2 border hover:bg-muted"
          >
            Try sample data
          </button>
          <Link to="/dashboard" className="rounded-lg px-3 py-2 border hover:bg-muted">
            Go to Dashboard
          </Link>
        </div>

        {status === "parsing" && (
          <div className="mt-6 text-sm text-muted-foreground">Parsing file…</div>
        )}

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-destructive">
            {error}
          </div>
        )}

        {status === "saved" && (
          <div className="mt-6 rounded-lg border bg-emerald-50 p-4 text-emerald-900">
            <div className="font-semibold mb-1">Import complete</div>
            <div className="text-sm">
              Saved <span className="font-medium">{count}</span> items from <span className="font-medium">{lastFilename}</span>.
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setRedirect(true)}
                className="rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
              >
                View in Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        Privacy note: Data is stored locally under <code>{LS_KEY}</code>. Clear it anytime from your browser storage.
      </div>
    </main>
  );
}

