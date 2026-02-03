# Contributing to Goodish

## Required Setup

### 1. Install gitleaks (Required)

Secret scanning is enforced via pre-commit hooks. Install gitleaks before making commits:

**Windows:**
```bash
winget install gitleaks
```

**macOS:**
```bash
brew install gitleaks
```

**Linux:**
```bash
# Download from https://github.com/gitleaks/gitleaks/releases
```

Verify installation:
```bash
gitleaks version
```

### 2. Configure git hooks (One-time setup)

After cloning the repository, configure git to use the tracked hooks:

```bash
git config core.hooksPath .githooks
```

This enables the pre-commit hook that scans for secrets before each commit.

## Manual Secret Scanning

To manually scan the repository for secrets:

```bash
# Scan all files
gitleaks detect --verbose

# Scan staged changes only
gitleaks protect --staged --verbose
```

## What Happens When You Commit

1. The pre-commit hook automatically runs `gitleaks protect --staged`
2. If secrets are detected, the commit is **blocked**
3. If no secrets are found, the commit proceeds normally

## Troubleshooting

**Error: "gitleaks is not installed"**
- Install gitleaks using one of the methods above
- Restart your terminal
- Try committing again

**Secret detected but it's a false positive?**
- Check the gitleaks output for the specific pattern detected
- If it's truly a false positive, you can add it to `.gitleaksignore` (not recommended for real secrets)
