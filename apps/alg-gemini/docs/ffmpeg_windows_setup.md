# FFmpeg Setup for Windows

The audio processing pipeline requires **ffmpeg** and **ffprobe** to be installed and available in your system PATH.

## Installation

### Option 1: Winget (Recommended)

```powershell
winget install --id Gyan.FFmpeg -e
```

### Option 2: Chocolatey

```powershell
choco install ffmpeg
```

### Option 3: Manual Download

1. Download from https://ffmpeg.org/download.html (choose Windows builds)
2. Extract to a permanent location (e.g., `C:\ffmpeg`)
3. Add `C:\ffmpeg\bin` to your system PATH

## Verification

After installation, **open a new terminal** (PATH reloads on new sessions) and run:

```powershell
# Check versions
ffmpeg -version
ffprobe -version

# Verify they're in PATH
where.exe ffmpeg
where.exe ffprobe
```

You should see version output for both commands. If you get "command not found", ensure you've opened a new terminal after installation.

## Self-Check Script

Run the dependency check script to verify your setup:

```powershell
cd apps/alg-gemini
powershell -ExecutionPolicy Bypass -File scripts/check_audio_deps.ps1
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "command not found" after install | Open a new terminal (PATH not reloaded) |
| ffmpeg installed but not in PATH | Add the bin directory to system PATH manually |
| Permission denied | Run terminal as Administrator for installation |
