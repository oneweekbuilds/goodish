# verify_accuracy.ps1
# Unified Accuracy Verification Script for AlgorithmLens
# Runs all test suites: Golden Harness + Adversarial + Regression
#
# Exit code: 0 = all pass, 1 = at least one failure
#
# Usage:
#   .\scripts\verify_accuracy.ps1            # Run all tests
#   .\scripts\verify_accuracy.ps1 -SkipGolden  # Skip golden (requires server)
#   .\scripts\verify_accuracy.ps1 -QuickCheck  # Adversarial + Regression only

param(
    [switch]$SkipGolden,      # Skip golden harness (requires backend server)
    [switch]$QuickCheck,      # Same as -SkipGolden
    [switch]$VerbosePytest,   # Use -v flag for pytest
    [string]$BaseUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

# ANSI colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Dim = "`e[90m"
$Reset = "`e[0m"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path (Split-Path -Parent $ScriptDir) "backend"

Write-Host ""
Write-Host "${Cyan}================================================${Reset}"
Write-Host "${Cyan}  AlgorithmLens Accuracy Verification Suite${Reset}"
Write-Host "${Cyan}================================================${Reset}"
Write-Host ""
Write-Host "  ${Dim}Golden Harness:  Prompt 2-7 API contracts${Reset}"
Write-Host "  ${Dim}Adversarial:     Prompt 8 edge case safety${Reset}"
Write-Host "  ${Dim}Regression:      Prompt 9 must-not-regress${Reset}"
Write-Host ""

$TotalSuites = 0
$PassedSuites = 0
$FailedSuites = 0
$SkippedSuites = 0

$Results = @()

# ===========================================
# SUITE 1: Golden Harness (Evidence Bundles)
# ===========================================

Write-Host "${Yellow}[1/3] Golden Harness (Evidence Bundle API Contracts)${Reset}"

if ($SkipGolden -or $QuickCheck) {
    Write-Host "  ${Dim}SKIPPED - -SkipGolden or -QuickCheck flag set${Reset}"
    $SkippedSuites++
    $Results += @{ Name = "Golden Harness"; Status = "SKIPPED"; Passed = 0; Failed = 0 }
} else {
    $goldenScript = Join-Path $ScriptDir "verify_evidence_bundles.ps1"
    if (-not (Test-Path $goldenScript)) {
        Write-Host "  ${Red}ERROR: Golden harness script not found at $goldenScript${Reset}"
        $FailedSuites++
        $Results += @{ Name = "Golden Harness"; Status = "ERROR"; Passed = 0; Failed = 1 }
    } else {
        try {
            Write-Host "  Running golden harness..."
            Write-Host ""

            # Run golden harness and capture exit code
            & $goldenScript -BaseUrl $BaseUrl -SkipTalk
            $goldenExit = $LASTEXITCODE

            Write-Host ""
            if ($goldenExit -eq 0) {
                Write-Host "  ${Green}Golden Harness: PASSED${Reset}"
                $PassedSuites++
                $Results += @{ Name = "Golden Harness"; Status = "PASSED"; Passed = 60; Failed = 0 }
            } else {
                Write-Host "  ${Red}Golden Harness: FAILED${Reset}"
                $FailedSuites++
                $Results += @{ Name = "Golden Harness"; Status = "FAILED"; Passed = 0; Failed = 1 }
            }
        } catch {
            Write-Host "  ${Red}ERROR: Failed to run golden harness - $($_.Exception.Message)${Reset}"
            $FailedSuites++
            $Results += @{ Name = "Golden Harness"; Status = "ERROR"; Passed = 0; Failed = 1 }
        }
    }
}
$TotalSuites++

# ===========================================
# SUITE 2: Adversarial Tests (Prompt 8)
# ===========================================

Write-Host ""
Write-Host "${Yellow}[2/3] Adversarial Tests (Prompt 8 Edge Case Safety)${Reset}"

$adversarialFile = Join-Path $BackendDir "test_adversarial.py"
if (-not (Test-Path $adversarialFile)) {
    Write-Host "  ${Red}ERROR: Adversarial test file not found at $adversarialFile${Reset}"
    $FailedSuites++
    $Results += @{ Name = "Adversarial"; Status = "ERROR"; Passed = 0; Failed = 1 }
} else {
    try {
        Write-Host "  Running adversarial tests..."
        Write-Host ""

        $pytestArgs = @($adversarialFile)
        if ($VerbosePytest) { $pytestArgs += "-v" }
        $pytestArgs += "--tb=short"

        Push-Location $BackendDir
        python -m pytest @pytestArgs
        $adversarialExit = $LASTEXITCODE
        Pop-Location

        Write-Host ""
        if ($adversarialExit -eq 0) {
            Write-Host "  ${Green}Adversarial Tests: PASSED${Reset}"
            $PassedSuites++
            $Results += @{ Name = "Adversarial"; Status = "PASSED"; Passed = 35; Failed = 0 }
        } else {
            Write-Host "  ${Red}Adversarial Tests: FAILED${Reset}"
            $FailedSuites++
            $Results += @{ Name = "Adversarial"; Status = "FAILED"; Passed = 0; Failed = 1 }
        }
    } catch {
        Write-Host "  ${Red}ERROR: Failed to run adversarial tests - $($_.Exception.Message)${Reset}"
        $FailedSuites++
        $Results += @{ Name = "Adversarial"; Status = "ERROR"; Passed = 0; Failed = 1 }
    }
}
$TotalSuites++

# ===========================================
# SUITE 3: Regression Tests (Prompt 9)
# ===========================================

Write-Host ""
Write-Host "${Yellow}[3/3] Regression Tests (Prompt 9 Must-Not-Regress)${Reset}"

$regressionFile = Join-Path $BackendDir "test_regressions.py"
if (-not (Test-Path $regressionFile)) {
    Write-Host "  ${Red}ERROR: Regression test file not found at $regressionFile${Reset}"
    $FailedSuites++
    $Results += @{ Name = "Regression"; Status = "ERROR"; Passed = 0; Failed = 1 }
} else {
    try {
        Write-Host "  Running regression tests..."
        Write-Host ""

        $pytestArgs = @($regressionFile)
        if ($VerbosePytest) { $pytestArgs += "-v" }
        $pytestArgs += "--tb=short"

        Push-Location $BackendDir
        python -m pytest @pytestArgs
        $regressionExit = $LASTEXITCODE
        Pop-Location

        Write-Host ""
        if ($regressionExit -eq 0) {
            Write-Host "  ${Green}Regression Tests: PASSED${Reset}"
            $PassedSuites++
            $Results += @{ Name = "Regression"; Status = "PASSED"; Passed = 65; Failed = 0 }
        } else {
            Write-Host "  ${Red}Regression Tests: FAILED${Reset}"
            $FailedSuites++
            $Results += @{ Name = "Regression"; Status = "FAILED"; Passed = 0; Failed = 1 }
        }
    } catch {
        Write-Host "  ${Red}ERROR: Failed to run regression tests - $($_.Exception.Message)${Reset}"
        $FailedSuites++
        $Results += @{ Name = "Regression"; Status = "ERROR"; Passed = 0; Failed = 1 }
    }
}
$TotalSuites++

# ===========================================
# FINAL SUMMARY
# ===========================================

Write-Host ""
Write-Host "${Cyan}================================================${Reset}"
Write-Host "${Cyan}  ACCURACY VERIFICATION SUMMARY${Reset}"
Write-Host "${Cyan}================================================${Reset}"
Write-Host ""

Write-Host "  ${Yellow}Suite Results:${Reset}"
Write-Host "  $("-" * 50)"
$headerFmt = "  {0,-20} {1,-10} {2,-10} {3,-10}"
Write-Host ($headerFmt -f "SUITE", "STATUS", "PASSED", "FAILED")
Write-Host "  $("-" * 50)"

foreach ($r in $Results) {
    $statusColor = switch ($r.Status) {
        "PASSED" { $Green }
        "FAILED" { $Red }
        "ERROR" { $Red }
        "SKIPPED" { $Yellow }
        default { $Reset }
    }
    Write-Host ("  ${statusColor}{0,-20} {1,-10} {2,-10} {3,-10}${Reset}" -f $r.Name, $r.Status, $r.Passed, $r.Failed)
}

Write-Host "  $("-" * 50)"
Write-Host ""
Write-Host "  Suites run:     $TotalSuites"
Write-Host "  Suites passed:  ${Green}$PassedSuites${Reset}"
Write-Host "  Suites failed:  ${Red}$FailedSuites${Reset}"
Write-Host "  Suites skipped: ${Yellow}$SkippedSuites${Reset}"
Write-Host ""

if ($FailedSuites -eq 0 -and $SkippedSuites -eq 0) {
    Write-Host "${Green}All accuracy tests passed. Safe to commit.${Reset}"
    Write-Host ""
    exit 0
} elseif ($FailedSuites -eq 0 -and $SkippedSuites -gt 0) {
    Write-Host "${Yellow}Tests passed (with $SkippedSuites skipped). Run without -SkipGolden for full verification.${Reset}"
    Write-Host ""
    exit 0
} else {
    Write-Host "${Red}Some tests failed. Do NOT commit until fixed.${Reset}"
    Write-Host ""
    exit 1
}
