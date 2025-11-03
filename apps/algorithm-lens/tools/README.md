# AlgorithmLens Snapshot & Rollback System

Professional, self-contained local snapshot system to freeze and restore AlgorithmLens state safely.

## Quick Reference

### Create a Snapshot

```powershell
cd "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens\tools"
.\snapshot.ps1 -Label golden
```

**Available Labels:**
- `golden` - Stable milestone versions
- `manual` - Default label for manual snapshots
- `auto` - Automatic snapshots (used by Task Scheduler)
- Any custom label you prefer

### Restore from a Snapshot

```powershell
cd "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens\tools"
.\restore-from-tag.ps1 -Tag algorithmlens-golden-2025-01-15-143022
```

**To List Available Tags:**
```powershell
cd "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish"
git tag -l "algorithmlens-*"
```

### Schedule Automatic Snapshots

Use Windows Task Scheduler to run periodic backups:

**Task Scheduler Settings:**
- **Program/script:** `powershell.exe`
- **Add arguments:** `-ExecutionPolicy Bypass -File "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens\tools\auto-snapshot.ps1"`
- **Start in:** `C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish\apps\algorithm-lens\tools`
- **Trigger:** Set your preferred schedule (daily, weekly, etc.)

## How It Works

### Snapshot Process (`snapshot.ps1`)

1. **Auto-commits** any pending changes in `apps/algorithm-lens/`
2. **Creates a git tag** with format: `algorithmlens-<label>-<timestamp>`
3. **Generates two backup ZIP files**:
   - `code-only.zip` - Source code only (excludes `node_modules/`, `dist/`, `.vite/`)
   - `full.zip` - Complete backup including all dependencies
4. **Stores backups** in: `C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\backups\algorithm-lens\<label>-<timestamp>\`

### Restore Process (`restore-from-tag.ps1`)

1. **Verifies** the tag exists
2. **Creates a safety branch** named `restore-<tag>-<timestamp>` (your current work is preserved)
3. **Checks out** the tag into the safety branch
4. **Restores dependencies** by running `npm ci` in `apps/algorithm-lens/`

**Safety Note:** The restore creates a new branch, so your current branch and uncommitted changes remain safe.

## Backup Location

All snapshots are stored in:
```
C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\backups\algorithm-lens\
```

Each snapshot has its own folder:
```
<label>-<timestamp>/
├── code-only.zip
└── full.zip
```

## Requirements

- PowerShell 5.1 or later
- Git installed and accessible
- Node.js and npm (for restore dependency resolution)
- Write access to backup directory (will be created automatically)

## Troubleshooting

### "Not in a git repository" error
Ensure you're running the scripts from within the monorepo. The scripts automatically navigate to the git root.

### "Tag does not exist" error
List all available tags with:
```powershell
git tag -l "algorithmlens-*"
```

### Snapshot takes too long
The full backup includes `node_modules/` and can be large. Use `code-only.zip` for faster backups if you don't need dependencies.

### Restore fails on `npm ci`
Ensure `package-lock.json` exists. If it's missing, the script will warn you and you may need to run `npm install` manually.

