# verify_evidence_bundles.ps1
# Deterministic verification of all Evidence Bundle and Talk endpoints
# Supports Golden Scan Pack for regression testing
# Exit code: 0 = all pass, 1 = at least one failure

param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$ScanId = "",
    [switch]$SkipTalk  # Skip talk endpoints (faster for quick checks)
)

$ErrorActionPreference = "Stop"

# ANSI colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Dim = "`e[90m"
$Reset = "`e[0m"

$script:TotalPassCount = 0
$script:TotalFailCount = 0
$script:ScanResults = @()

function Write-Status {
    param([string]$Tab, [string]$Endpoint, [bool]$Passed, [string]$Details = "")
    $status = if ($Passed) { "${Green}PASS${Reset}" } else { "${Red}FAIL${Reset}" }
    $detailStr = if ($Details) { " - $Details" } else { "" }
    Write-Host "    [$status] $Tab ($Endpoint)$detailStr"
}

function Test-RequiredFields {
    param([PSCustomObject]$Response, [string[]]$Fields)
    $missing = @()
    foreach ($field in $Fields) {
        $parts = $field -split '\.'
        $current = $Response
        foreach ($part in $parts) {
            if ($null -eq $current) { break }
            $current = $current.$part
        }
        if ($null -eq $current) {
            $missing += $field
        }
    }
    return $missing
}

function Get-BundleStats {
    param([PSCustomObject]$Response)
    $stats = @{}

    # Extract item count from meta (uses n_items field)
    if ($Response.bundle -and $Response.bundle.meta) {
        $meta = $Response.bundle.meta
        if ($null -ne $meta.n_items) {
            $stats["items"] = $meta.n_items
        }
        if ($null -ne $meta.platform) {
            $stats["platform"] = $meta.platform
        }
    }

    # Extract observation counts by type
    if ($Response.bundle -and $Response.bundle.observations) {
        $obs = $Response.bundle.observations
        if ($obs -is [Array]) {
            $stats["obs"] = $obs.Count
        }
    }

    # Extract measurement counts
    if ($Response.bundle -and $Response.bundle.measurements) {
        $m = $Response.bundle.measurements
        if ($m -is [Array]) {
            $stats["meas"] = $m.Count
        }
    }

    # Count insight fields in analysis (primary_insight, concentration_insight, etc.)
    if ($Response.analysis) {
        $insightCount = 0
        foreach ($prop in $Response.analysis.PSObject.Properties) {
            if ($prop.Name -like "*_insight*") {
                $insightCount++
            }
        }
        if ($insightCount -gt 0) {
            $stats["insights"] = $insightCount
        }
    }

    return $stats
}

function Format-StatsString {
    param([hashtable]$Stats)
    $parts = @()
    foreach ($key in $Stats.Keys | Sort-Object) {
        $parts += "${key}:$($Stats[$key])"
    }
    if ($parts.Count -eq 0) { return "" }
    return $parts -join ", "
}

function Test-SingleScan {
    param(
        [string]$ScanId,
        [string]$SourceType,
        [string]$Platform,
        [string]$Note,
        [int]$Index,
        [int]$Total
    )

    $scanPass = 0
    $scanFail = 0
    $tabSummary = @()

    Write-Host ""
    Write-Host "${Cyan}[$Index/$Total] Scan: $ScanId${Reset}"
    Write-Host "  ${Dim}Source: $SourceType | Platform: $Platform${Reset}"
    if ($Note) {
        Write-Host "  ${Dim}Note: $Note${Reset}"
    }
    Write-Host ""

    # Evidence Bundle endpoints
    Write-Host "  ${Yellow}Evidence Bundles:${Reset}"

    $EvidenceTabs = @(
        @{ Name = "Ads"; Endpoint = "ads"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
        @{ Name = "Politics"; Endpoint = "politics"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
        @{ Name = "Patterns"; Endpoint = "patterns"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
        @{ Name = "Creators"; Endpoint = "creators"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
        @{ Name = "Inferences"; Endpoint = "inferences"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") }
    )

    foreach ($tab in $EvidenceTabs) {
        $url = "$BaseUrl/api/scans/$ScanId/evidence-bundle/$($tab.Endpoint)"
        try {
            $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
            $missing = Test-RequiredFields -Response $response -Fields $tab.RequiredFields
            $stats = Get-BundleStats -Response $response
            $statsStr = Format-StatsString -Stats $stats

            if ($missing.Count -eq 0) {
                Write-Status -Tab $tab.Name -Endpoint $tab.Endpoint -Passed $true -Details $statsStr
                $scanPass++
                $tabSummary += @{ Tab = $tab.Name; Type = "evidence"; Passed = $true; Stats = $stats }
            } else {
                Write-Status -Tab $tab.Name -Endpoint $tab.Endpoint -Passed $false -Details "Missing: $($missing -join ', ')"
                $scanFail++
                $tabSummary += @{ Tab = $tab.Name; Type = "evidence"; Passed = $false; Missing = $missing }
            }
        } catch {
            Write-Status -Tab $tab.Name -Endpoint $tab.Endpoint -Passed $false -Details $_.Exception.Message
            $scanFail++
            $tabSummary += @{ Tab = $tab.Name; Type = "evidence"; Passed = $false; Error = $_.Exception.Message }
        }
    }

    # Talk endpoints (skip if -SkipTalk)
    if (-not $SkipTalk) {
        Write-Host ""
        Write-Host "  ${Yellow}Talk Endpoints:${Reset}"

        $TalkTabs = @(
            @{ Name = "Ads"; Endpoint = "ads"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
            @{ Name = "Politics"; Endpoint = "politics"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
            @{ Name = "Patterns"; Endpoint = "patterns"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
            @{ Name = "Creators"; Endpoint = "creators"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
            @{ Name = "Inferences"; Endpoint = "inferences"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") }
        )

        $TestQuestion = "What patterns did you observe?"

        foreach ($tab in $TalkTabs) {
            $url = "$BaseUrl/api/scans/$ScanId/talk/$($tab.Endpoint)"
            try {
                $body = @{ question = $TestQuestion }
                $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -TimeoutSec 30
                $missing = Test-RequiredFields -Response $response -Fields $tab.RequiredFields
                if ($missing.Count -eq 0) {
                    Write-Status -Tab $tab.Name -Endpoint "talk/$($tab.Endpoint)" -Passed $true
                    $scanPass++
                    $tabSummary += @{ Tab = $tab.Name; Type = "talk"; Passed = $true }
                } else {
                    Write-Status -Tab $tab.Name -Endpoint "talk/$($tab.Endpoint)" -Passed $false -Details "Missing: $($missing -join ', ')"
                    $scanFail++
                    $tabSummary += @{ Tab = $tab.Name; Type = "talk"; Passed = $false; Missing = $missing }
                }
            } catch {
                Write-Status -Tab $tab.Name -Endpoint "talk/$($tab.Endpoint)" -Passed $false -Details $_.Exception.Message
                $scanFail++
                $tabSummary += @{ Tab = $tab.Name; Type = "talk"; Passed = $false; Error = $_.Exception.Message }
            }
        }
    }

    # Print scan summary row
    $scanStatus = if ($scanFail -eq 0) { "${Green}PASS${Reset}" } else { "${Red}FAIL${Reset}" }
    Write-Host ""
    Write-Host "  ${Dim}Scan Result: [$scanStatus] $scanPass passed, $scanFail failed${Reset}"

    $script:TotalPassCount += $scanPass
    $script:TotalFailCount += $scanFail
    $script:ScanResults += @{
        ScanId = $ScanId
        SourceType = $SourceType
        Platform = $Platform
        PassCount = $scanPass
        FailCount = $scanFail
        Tabs = $tabSummary
    }

    return $scanFail -eq 0
}

# ===========================================
# MAIN EXECUTION
# ===========================================

Write-Host ""
Write-Host "${Cyan}================================================${Reset}"
Write-Host "${Cyan}  AlgorithmLens Evidence Bundle Verifier${Reset}"
Write-Host "${Cyan}================================================${Reset}"
Write-Host ""

# Step 1: Health check (once at start)
Write-Host "${Yellow}[1/3] Checking backend health...${Reset}"
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "  ${Green}Backend is running at $BaseUrl${Reset}"
    } else {
        Write-Host "  ${Red}Backend returned unexpected status: $($health.status)${Reset}"
        exit 1
    }
} catch {
    Write-Host "  ${Red}Backend not reachable at $BaseUrl${Reset}"
    Write-Host "  ${Red}Error: $($_.Exception.Message)${Reset}"
    Write-Host ""
    Write-Host "  Start the backend with: cd apps/alg-gemini/backend && python -m uvicorn app:app --reload"
    exit 1
}

# Step 2: Determine scan list
Write-Host ""
Write-Host "${Yellow}[2/3] Loading scan list...${Reset}"

$ScansToTest = @()
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$GoldenFile = Join-Path $ScriptDir "golden_scans.json"

if ($ScanId -ne "") {
    # Explicit scan ID provided - single scan mode
    Write-Host "  Using provided scan ID: $ScanId"
    $ScansToTest += @{
        scan_id = $ScanId
        source_type = "UNKNOWN"
        platform = "UNKNOWN"
        note = "User-provided scan ID"
    }
}
elseif (Test-Path $GoldenFile) {
    # Golden pack exists - use it
    Write-Host "  ${Green}Found golden_scans.json - using Golden Scan Pack${Reset}"
    try {
        $goldenData = Get-Content $GoldenFile -Raw | ConvertFrom-Json
        $ScansToTest = $goldenData.scans
        Write-Host "  Loaded $($ScansToTest.Count) scans from golden pack"
        Write-Host "  ${Dim}Pack version: $($goldenData.version)${Reset}"
    } catch {
        Write-Host "  ${Red}Failed to parse golden_scans.json: $($_.Exception.Message)${Reset}"
        exit 1
    }
}
else {
    # Fallback to single scan from API
    Write-Host "  ${Dim}No golden_scans.json found - falling back to single scan mode${Reset}"
    try {
        $scans = Invoke-RestMethod -Uri "$BaseUrl/api/scans" -Method Get -TimeoutSec 10
        if ($scans.scans.Count -eq 0) {
            Write-Host "  ${Red}No scans found in database${Reset}"
            Write-Host "  ${Red}Upload a scan first via the dashboard or desktop extension${Reset}"
            exit 1
        }
        $usableScan = $scans.scans | Where-Object { $_.total_items -gt 0 } | Select-Object -First 1
        if ($null -eq $usableScan) {
            Write-Host "  ${Red}No scans with data found${Reset}"
            exit 1
        }
        Write-Host "  Using scan: $($usableScan.id) (platform: $($usableScan.platform))"
        $ScansToTest += @{
            scan_id = $usableScan.id
            source_type = if ($usableScan.id.StartsWith("desktop-")) { "DESKTOP" } else { "MOBILE_VIDEO" }
            platform = $usableScan.platform
            note = "Auto-selected from database"
        }
    } catch {
        Write-Host "  ${Red}Failed to fetch scans: $($_.Exception.Message)${Reset}"
        exit 1
    }
}

# Step 3: Test each scan
Write-Host ""
Write-Host "${Yellow}[3/3] Testing scans...${Reset}"

$totalScans = $ScansToTest.Count
$passedScans = 0
$failedScans = 0
$scanIndex = 0

foreach ($scan in $ScansToTest) {
    $scanIndex++
    $result = Test-SingleScan `
        -ScanId $scan.scan_id `
        -SourceType $scan.source_type `
        -Platform $scan.platform `
        -Note $scan.note `
        -Index $scanIndex `
        -Total $totalScans

    if ($result) {
        $passedScans++
    } else {
        $failedScans++
    }
}

# ===========================================
# FINAL SUMMARY
# ===========================================

Write-Host ""
Write-Host "${Cyan}================================================${Reset}"
Write-Host "${Cyan}  SUMMARY${Reset}"
Write-Host "${Cyan}================================================${Reset}"
Write-Host ""

# Per-scan summary table
Write-Host "  ${Yellow}Scan Results:${Reset}"
Write-Host "  $("-" * 76)"
$headerFmt = "  {0,-45} {1,-12} {2,-8} {3,-8}"
Write-Host ($headerFmt -f "SCAN_ID", "SOURCE", "PASS", "FAIL")
Write-Host "  $("-" * 76)"
foreach ($sr in $script:ScanResults) {
    $shortId = if ($sr.ScanId.Length -gt 43) { $sr.ScanId.Substring(0,40) + "..." } else { $sr.ScanId }
    $rowStatus = if ($sr.FailCount -eq 0) { $Green } else { $Red }
    Write-Host ("  ${rowStatus}{0,-45} {1,-12} {2,-8} {3,-8}${Reset}" -f $shortId, $sr.SourceType, $sr.PassCount, $sr.FailCount)
}
Write-Host "  $("-" * 76)"
Write-Host ""

# Totals
Write-Host "  Scans tested:   $totalScans"
Write-Host "  Scans passed:   ${Green}$passedScans${Reset}"
Write-Host "  Scans failed:   ${Red}$failedScans${Reset}"
Write-Host ""
Write-Host "  Total checks:   $($script:TotalPassCount + $script:TotalFailCount)"
Write-Host "  Checks passed:  ${Green}$($script:TotalPassCount)${Reset}"
Write-Host "  Checks failed:  ${Red}$($script:TotalFailCount)${Reset}"
Write-Host ""

if ($script:TotalFailCount -eq 0) {
    Write-Host "${Green}All endpoints verified across all scans. Safe to commit.${Reset}"
    Write-Host ""
    exit 0
} else {
    Write-Host "${Red}Some endpoints failed verification. Do NOT commit until fixed.${Reset}"
    Write-Host ""

    # List failed scans
    Write-Host "Failed scans:"
    foreach ($sr in ($script:ScanResults | Where-Object { $_.FailCount -gt 0 })) {
        Write-Host "  - $($sr.ScanId): $($sr.FailCount) failures"
        foreach ($tab in ($sr.Tabs | Where-Object { -not $_.Passed })) {
            $detail = if ($tab.Missing) { "Missing: $($tab.Missing -join ', ')" } elseif ($tab.Error) { "Error: $($tab.Error)" } else { "" }
            Write-Host "    - $($tab.Tab) ($($tab.Type)): $detail"
        }
    }
    Write-Host ""
    exit 1
}
