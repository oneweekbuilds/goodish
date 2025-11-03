param(
    [string]$Label = "manual"
)

# Configuration
$MonorepoRoot = "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish"
$AppPath = "apps\algorithm-lens"
$BackupRoot = "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\backups\algorithm-lens"

# Get timestamp
$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$TagName = "algorithmlens-$Label-$Timestamp"
$BackupDir = Join-Path $BackupRoot "$Label-$Timestamp"

Write-Host "Creating snapshot: $TagName" -ForegroundColor Cyan

# Change to monorepo root
Push-Location $MonorepoRoot
try {
    # Check if we're in a git repository
    $gitRoot = git rev-parse --show-toplevel 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Not in a git repository or git not available" -ForegroundColor Red
        exit 1
    }

    # Check for pending changes in apps/algorithm-lens
    $hasChanges = git status --porcelain $AppPath 2>&1
    if ($hasChanges) {
        Write-Host "Staging changes in $AppPath..." -ForegroundColor Yellow
        git add "$AppPath/*" 2>&1 | Out-Null
        git add "$AppPath/.*" 2>&1 | Out-Null
        
        Write-Host "Committing changes..." -ForegroundColor Yellow
        $commitMessage = "snapshot: $Label - $Timestamp"
        git commit -m $commitMessage 2>&1 | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Commit may have failed (no changes to commit or other issue)" -ForegroundColor Yellow
        } else {
            Write-Host "Changes committed successfully" -ForegroundColor Green
        }
    } else {
        Write-Host "No pending changes to commit" -ForegroundColor Gray
    }

    # Create git tag
    Write-Host "Creating git tag: $TagName..." -ForegroundColor Yellow
    git tag $TagName 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to create git tag" -ForegroundColor Red
        exit 1
    }
    Write-Host "Tag created successfully" -ForegroundColor Green

    # Create backup directory
    Write-Host "Creating backup directory: $BackupDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

    # Get full path to algorithm-lens app
    $AppFullPath = Join-Path $MonorepoRoot $AppPath

    # Create code-only zip (exclude node_modules, dist, .vite)
    Write-Host "Creating code-only backup..." -ForegroundColor Yellow
    $CodeOnlyZip = Join-Path $BackupDir "code-only.zip"
    
    # Create temp directory for code-only version
    $TempCodeDir = Join-Path $BackupDir "temp-code"
    Remove-Item -Path $TempCodeDir -Recurse -Force -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force -Path $TempCodeDir | Out-Null
    
    Push-Location $AppFullPath
    try {
        # Copy files excluding specified directories and NUL files
        Get-ChildItem -Path . -Recurse -File | 
            Where-Object { 
                $relativePath = $_.FullName.Replace($AppFullPath, "").TrimStart('\')
                $relativePath -notmatch "^node_modules" -and
                $relativePath -notmatch "\\node_modules" -and
                $relativePath -notmatch "^dist" -and
                $relativePath -notmatch "\\dist" -and
                $relativePath -notmatch "^\.vite" -and
                $relativePath -notmatch "\.vite" -and
                $relativePath -notmatch "^\.tailwind-cache" -and
                $relativePath -notmatch "\.tailwind-cache" -and
                $_.Name -ne "NUL" -and
                $relativePath -notmatch "\\NUL$" -and
                $relativePath -ne "NUL"
            } |
            ForEach-Object {
                $relativePath = $_.FullName.Replace($AppFullPath, "").TrimStart('\')
                $destPath = Join-Path $TempCodeDir $relativePath
                $destDir = Split-Path $destPath -Parent
                New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        
        # Compress the temp directory
        Push-Location $TempCodeDir
        try {
            Compress-Archive -Path * -DestinationPath $CodeOnlyZip -Force
        } finally {
            Pop-Location
        }
        
        # Clean up temp directory
        Remove-Item -Path $TempCodeDir -Recurse -Force -ErrorAction SilentlyContinue
    } finally {
        Pop-Location
    }
    Write-Host "Code-only backup created: $CodeOnlyZip" -ForegroundColor Green

    # Create full zip (including node_modules)
    Write-Host "Creating full backup (this may take a while)..." -ForegroundColor Yellow
    $FullZip = Join-Path $BackupDir "full.zip"
    Push-Location $AppFullPath
    try {
        # Exclude NUL files and ZIP files
        $itemsToZip = Get-ChildItem -Path . -Force | Where-Object { 
            $_.Name -ne "NUL" -and 
            $_.Name -ne "full.zip" -and 
            $_.Name -ne "code-only.zip" -and
            $_.Name -notmatch "\.zip$"
        }
        if ($itemsToZip) {
            $itemsToZip | Compress-Archive -DestinationPath $FullZip -Force
        }
    } finally {
        Pop-Location
    }
    Write-Host "Full backup created: $FullZip" -ForegroundColor Green

    Write-Host ""
    Write-Host "Snapshot completed successfully!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "Tag: $TagName" -ForegroundColor Cyan
    Write-Host "Backup location: $BackupDir" -ForegroundColor Cyan
    Write-Host "  - code-only.zip" -ForegroundColor Gray
    Write-Host "  - full.zip" -ForegroundColor Gray

} finally {
    Pop-Location
}

