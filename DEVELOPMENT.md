# AlgorithmLens Development Guide

## Which App to Use

| Folder | Status | Purpose |
|--------|--------|---------|
| `apps/alg-gemini` | **PRIMARY** | Active development - use this |
| `apps/algorithm-lens` | LEGACY | Reference only - DO NOT EDIT |

## Running the Frontend

```powershell
cd c:\Users\jwjwi\goodish-new\goodish\apps\alg-gemini
npm run dev
```

**Canonical URL:** http://localhost:5173/dashboard

## App Provenance

The alg-gemini app is the canonical frontend for AlgorithmLens:
- Uses JSX (not TSX)
- Catalog-driven dashboard architecture
- Connected to backend in `apps/alg-gemini/backend`

The algorithm-lens app is kept for reference only:
- Uses TSX
- Has editorial dashboard experiments
- NOT connected to live backend

## Port Assignments

- **5173**: alg-gemini (primary)
- Other ports may be stale servers - kill them if needed

## Troubleshooting

### Multiple servers running?
```powershell
netstat -ano | findstr ":517"
```

### Wrong app running?
Look for the "ALG-GEMINI RUNNING" watermark in the bottom-right corner of the dashboard.
