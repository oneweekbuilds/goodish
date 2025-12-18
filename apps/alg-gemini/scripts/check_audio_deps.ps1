# check_audio_deps.ps1
# Verifies audio processing dependencies are available
#
# Checks:
#   - ffmpeg in PATH
#   - ffprobe in PATH
#   - faster-whisper Python package installed
#
# Exit codes:
#   0 = All dependencies available
#   1 = One or more dependencies missing

$ErrorActionPreference = "Stop"

Write-Host "`n=== Audio Dependencies Check ===" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Check ffmpeg
Write-Host -NoNewline "ffmpeg in PATH:        "
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if ($ffmpeg) {
    Write-Host "[OK]" -ForegroundColor Green
    $version = & ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "  -> $version" -ForegroundColor DarkGray
} else {
    Write-Host "[MISSING]" -ForegroundColor Red
    $allPassed = $false
}

# Check ffprobe
Write-Host -NoNewline "ffprobe in PATH:       "
$ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
if ($ffprobe) {
    Write-Host "[OK]" -ForegroundColor Green
    $version = & ffprobe -version 2>&1 | Select-Object -First 1
    Write-Host "  -> $version" -ForegroundColor DarkGray
} else {
    Write-Host "[MISSING]" -ForegroundColor Red
    $allPassed = $false
}

# Check faster-whisper
Write-Host -NoNewline "faster-whisper:        "
try {
    $result = python -c "import faster_whisper; print(faster_whisper.__version__)" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK]" -ForegroundColor Green
        Write-Host "  -> version $result" -ForegroundColor DarkGray
    } else {
        Write-Host "[MISSING]" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "[MISSING]" -ForegroundColor Red
    $allPassed = $false
}

# Summary
Write-Host ""
if ($allPassed) {
    Write-Host "All audio dependencies available." -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "Some dependencies missing. See docs/ffmpeg_windows_setup.md for installation." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
