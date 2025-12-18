# verify_evidence_bundles.ps1
# Deterministic verification of all Evidence Bundle and Talk endpoints
# Exit code: 0 = all pass, 1 = at least one failure

param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$ScanId = ""
)

$ErrorActionPreference = "Stop"

# ANSI colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

$PassCount = 0
$FailCount = 0
$Results = @()

function Write-Status {
    param([string]$Tab, [string]$Endpoint, [bool]$Passed, [string]$Details = "")
    $status = if ($Passed) { "${Green}PASS${Reset}" } else { "${Red}FAIL${Reset}" }
    $detailStr = if ($Details) { " - $Details" } else { "" }
    Write-Host "  [$status] $Tab ($Endpoint)$detailStr"
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

Write-Host ""
Write-Host "${Cyan}========================================${Reset}"
Write-Host "${Cyan}AlgorithmLens Evidence Bundle Verifier${Reset}"
Write-Host "${Cyan}========================================${Reset}"
Write-Host ""

# Step 1: Health check
Write-Host "${Yellow}[1/4] Checking backend health...${Reset}"
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "  ${Green}Backend is running${Reset}"
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

# Step 2: Get a scan ID
Write-Host ""
Write-Host "${Yellow}[2/4] Getting scan ID...${Reset}"
if ($ScanId -eq "") {
    try {
        $scans = Invoke-RestMethod -Uri "$BaseUrl/api/scans" -Method Get -TimeoutSec 10
        if ($scans.scans.Count -eq 0) {
            Write-Host "  ${Red}No scans found in database${Reset}"
            Write-Host "  ${Red}Upload a scan first via the dashboard or desktop extension${Reset}"
            exit 1
        }
        # Find first scan with data (total_items > 0 indicates usable scan)
        $usableScan = $scans.scans | Where-Object { $_.total_items -gt 0 } | Select-Object -First 1
        if ($null -eq $usableScan) {
            Write-Host "  ${Red}No scans with data found${Reset}"
            exit 1
        }
        $ScanId = $usableScan.id
        Write-Host "  Using scan: $ScanId (platform: $($usableScan.platform))"
    } catch {
        Write-Host "  ${Red}Failed to fetch scans: $($_.Exception.Message)${Reset}"
        exit 1
    }
} else {
    Write-Host "  Using provided scan: $ScanId"
}

# Step 3: Test Evidence Bundle endpoints
Write-Host ""
Write-Host "${Yellow}[3/4] Testing Evidence Bundle endpoints...${Reset}"

$EvidenceTabs = @(
    @{ Name = "Ads & Influence"; Endpoint = "ads"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
    @{ Name = "Politics & Worldview"; Endpoint = "politics"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
    @{ Name = "Patterns"; Endpoint = "patterns"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
    @{ Name = "Creators & Voices"; Endpoint = "creators"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") },
    @{ Name = "What Algorithm Thinks"; Endpoint = "inferences"; RequiredFields = @("scan_id", "tab", "bundle", "bundle.meta", "bundle.observations", "bundle.measurements", "bundle.limits", "analysis") }
)

foreach ($tab in $EvidenceTabs) {
    $url = "$BaseUrl/api/scans/$ScanId/evidence-bundle/$($tab.Endpoint)"
    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30
        $missing = Test-RequiredFields -Response $response -Fields $tab.RequiredFields
        if ($missing.Count -eq 0) {
            Write-Status -Tab $tab.Name -Endpoint "evidence-bundle/$($tab.Endpoint)" -Passed $true
            $PassCount++
            $Results += @{ Tab = $tab.Name; Type = "evidence"; Passed = $true }
        } else {
            Write-Status -Tab $tab.Name -Endpoint "evidence-bundle/$($tab.Endpoint)" -Passed $false -Details "Missing: $($missing -join ', ')"
            $FailCount++
            $Results += @{ Tab = $tab.Name; Type = "evidence"; Passed = $false; Missing = $missing }
        }
    } catch {
        Write-Status -Tab $tab.Name -Endpoint "evidence-bundle/$($tab.Endpoint)" -Passed $false -Details $_.Exception.Message
        $FailCount++
        $Results += @{ Tab = $tab.Name; Type = "evidence"; Passed = $false; Error = $_.Exception.Message }
    }
}

# Step 4: Test Talk endpoints
Write-Host ""
Write-Host "${Yellow}[4/4] Testing Talk endpoints...${Reset}"

$TalkTabs = @(
    @{ Name = "Ads & Influence"; Endpoint = "ads"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
    @{ Name = "Politics & Worldview"; Endpoint = "politics"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
    @{ Name = "Patterns"; Endpoint = "patterns"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
    @{ Name = "Creators & Voices"; Endpoint = "creators"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") },
    @{ Name = "What Algorithm Thinks"; Endpoint = "inferences"; RequiredFields = @("scan_id", "tab", "question", "response", "response.structured", "response.formatted_text", "cited_fields") }
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
            $PassCount++
            $Results += @{ Tab = $tab.Name; Type = "talk"; Passed = $true }
        } else {
            Write-Status -Tab $tab.Name -Endpoint "talk/$($tab.Endpoint)" -Passed $false -Details "Missing: $($missing -join ', ')"
            $FailCount++
            $Results += @{ Tab = $tab.Name; Type = "talk"; Passed = $false; Missing = $missing }
        }
    } catch {
        Write-Status -Tab $tab.Name -Endpoint "talk/$($tab.Endpoint)" -Passed $false -Details $_.Exception.Message
        $FailCount++
        $Results += @{ Tab = $tab.Name; Type = "talk"; Passed = $false; Error = $_.Exception.Message }
    }
}

# Summary
Write-Host ""
Write-Host "${Cyan}========================================${Reset}"
Write-Host "${Cyan}SUMMARY${Reset}"
Write-Host "${Cyan}========================================${Reset}"
Write-Host ""
Write-Host "  Total tests:  $($PassCount + $FailCount)"
Write-Host "  Passed:       ${Green}$PassCount${Reset}"
Write-Host "  Failed:       ${Red}$FailCount${Reset}"
Write-Host ""

if ($FailCount -eq 0) {
    Write-Host "${Green}All endpoints verified. Safe to commit.${Reset}"
    Write-Host ""
    exit 0
} else {
    Write-Host "${Red}Some endpoints failed verification. Do NOT commit until fixed.${Reset}"
    Write-Host ""
    Write-Host "Failed endpoints:"
    foreach ($result in ($Results | Where-Object { -not $_.Passed })) {
        $detail = if ($result.Missing) { "Missing: $($result.Missing -join ', ')" } elseif ($result.Error) { "Error: $($result.Error)" } else { "" }
        Write-Host "  - $($result.Tab) ($($result.Type)): $detail"
    }
    Write-Host ""
    exit 1
}
