# Auto-snapshot wrapper for Windows Task Scheduler
# This script calls snapshot.ps1 with the "auto" label

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$SnapshotScript = Join-Path $ScriptPath "snapshot.ps1"

Write-Host "Running auto-snapshot..." -ForegroundColor Cyan

try {
    & powershell -ExecutionPolicy Bypass -File $SnapshotScript -Label auto
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Auto-snapshot completed successfully" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "Auto-snapshot failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} catch {
    Write-Host "Error running auto-snapshot: $_" -ForegroundColor Red
    exit 1
}










