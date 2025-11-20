param(
    [Parameter(Mandatory=$true)]
    [string]$Tag
)

# Configuration
$MonorepoRoot = "C:\Users\jwjwi\OneDrive\Documents\GitHub\oneweekbuilds\goodish"
$AppPath = "apps\algorithm-lens"

# Get timestamp for safety branch
$Timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$SafetyBranch = "restore-$Tag-$Timestamp"

Write-Host "Restoring from tag: $Tag" -ForegroundColor Cyan
Write-Host "Safety branch: $SafetyBranch" -ForegroundColor Yellow

# Change to monorepo root
Push-Location $MonorepoRoot
try {
    # Check if we're in a git repository
    $gitRoot = git rev-parse --show-toplevel 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Not in a git repository or git not available" -ForegroundColor Red
        exit 1
    }

    # Verify tag exists
    Write-Host "Verifying tag exists..." -ForegroundColor Yellow
    $tagExists = git tag -l $Tag 2>&1
    if (-not $tagExists -or $tagExists -ne $Tag) {
        Write-Host "Error: Tag '$Tag' does not exist" -ForegroundColor Red
        Write-Host "Available tags (algorithmlens-*):" -ForegroundColor Yellow
        git tag -l "algorithmlens-*" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        exit 1
    }
    Write-Host "Tag verified" -ForegroundColor Green

    # Check current branch and warn if there are uncommitted changes
    $currentBranch = git branch --show-current 2>&1
    $hasUncommitted = git status --porcelain 2>&1
    if ($hasUncommitted) {
        Write-Host "Warning: You have uncommitted changes. They will remain in your working directory." -ForegroundColor Yellow
        Write-Host "The restore will create a new branch, so your current work won't be lost." -ForegroundColor Yellow
        $response = Read-Host "Continue? (Y/N)"
        if ($response -ne "Y" -and $response -ne "y") {
            Write-Host "Restore cancelled" -ForegroundColor Yellow
            exit 0
        }
    }

    # Create safety branch from current HEAD
    Write-Host "Creating safety branch: $SafetyBranch" -ForegroundColor Yellow
    git checkout -b $SafetyBranch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Failed to create safety branch (may already exist or other issue)" -ForegroundColor Yellow
    } else {
        Write-Host "Safety branch created" -ForegroundColor Green
    }

    # Reset to the tag (keeping safety branch name)
    Write-Host "Checking out tag: $Tag" -ForegroundColor Yellow
    git reset --hard $Tag 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to checkout tag" -ForegroundColor Red
        exit 1
    }
    Write-Host "Tag checked out successfully" -ForegroundColor Green

    # Change to app directory and restore dependencies
    $AppFullPath = Join-Path $MonorepoRoot $AppPath
    Push-Location $AppFullPath
    try {
        if (Test-Path "package-lock.json") {
            Write-Host "Restoring dependencies with npm ci..." -ForegroundColor Yellow
            npm ci 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "Warning: npm ci failed. You may need to run 'npm ci' manually." -ForegroundColor Yellow
            } else {
                Write-Host "Dependencies restored successfully" -ForegroundColor Green
            }
        } else {
            Write-Host "Warning: package-lock.json not found. Skipping dependency restore." -ForegroundColor Yellow
        }
    } finally {
        Pop-Location
    }

    Write-Host ""
    Write-Host "Restore completed successfully!" -ForegroundColor Green
    Write-Host "=================================" -ForegroundColor Green
    Write-Host "You are now on branch: $SafetyBranch" -ForegroundColor Cyan
    Write-Host "State matches tag: $Tag" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To return to your previous state:" -ForegroundColor Yellow
    Write-Host "  git checkout <your-previous-branch>" -ForegroundColor Gray

} finally {
    Pop-Location
}










