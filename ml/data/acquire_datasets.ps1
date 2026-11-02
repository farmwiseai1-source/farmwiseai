param(
  [string]$DataDir = $env:FARMWISE_DATA_DIR,
  [switch]$Execute,
  [switch]$IncludePlantVillage
)

if ([string]::IsNullOrWhiteSpace($DataDir)) {
  throw 'Set FARMWISE_DATA_DIR or pass -DataDir to an external dataset directory.'
}

$resolvedDataDir = [System.IO.Path]::GetFullPath($DataDir)
New-Item -ItemType Directory -Force -Path $resolvedDataDir | Out-Null
$status = @()
$statusPath = Join-Path $resolvedDataDir 'acquisition_status.json'
$previousStatus = @{}
if (Test-Path $statusPath) {
  foreach ($entry in @(Get-Content -LiteralPath $statusPath -Raw | ConvertFrom-Json)) { $previousStatus[$entry.id] = $entry }
}
$status += [pscustomobject]@{ id = 'riceleafdiseasebd-v3'; status = 'manual_required'; reason = 'Mendeley landing page requires operator download; no automated access attempted.' }
$status += [pscustomobject]@{ id = 'chili-krishna-v3'; status = 'manual_required'; reason = 'Mendeley landing page requires operator download; no automated access attempted.' }
$status += [pscustomobject]@{ id = 'mgleaf-disease-v2'; status = 'manual_required'; reason = 'Mendeley landing page requires operator download; no automated access attempted.' }

Write-Host "External dataset directory: $resolvedDataDir"
Write-Host 'Manual sources requiring download and license review:'
Write-Host '  RiceLeafDiseaseBD v3: https://data.mendeley.com/datasets/86s4jzj2m4/3'
Write-Host '  Chili Krishna River Basin v3: https://data.mendeley.com/datasets/ymt8k9bjkn/3'
Write-Host '  MGLeaf-Disease v2: https://data.mendeley.com/datasets/7m8n4ym4nm/2'

if (-not $Execute) {
  Write-Host 'Preview only. Re-run with -Execute to clone the two GitHub sources.'
  exit 0
}

$plantDoc = Join-Path $resolvedDataDir 'plantdoc-original'
if ($previousStatus.ContainsKey('plantdoc-original') -and $previousStatus['plantdoc-original'].status -eq 'blocked') {
  $status += $previousStatus['plantdoc-original']
  Write-Host 'PlantDoc skipped: previous acquisition blocker recorded; no automatic retry.'
} elseif (-not (Test-Path (Join-Path $plantDoc '.git'))) {
  if (Test-Path $plantDoc) {
    $status += [pscustomobject]@{ id = 'plantdoc-original'; status = 'blocked'; reason = 'Destination exists without a Git checkout; no automatic deletion or retry performed.' }
  } else {
    git clone https://github.com/pratikkayal/PlantDoc-Dataset $plantDoc
    if ($LASTEXITCODE -eq 0) { $status += [pscustomobject]@{ id = 'plantdoc-original'; status = 'acquired'; reason = 'Official repository clone completed.' } }
    else { $status += [pscustomobject]@{ id = 'plantdoc-original'; status = 'blocked'; reason = 'git clone failed; inspect network/authentication and retry manually.' } }
  }
} else { $status += [pscustomobject]@{ id = 'plantdoc-original'; status = 'already_present'; reason = 'Official repository checkout already exists.' } }
if ($IncludePlantVillage) {
  Write-Warning 'PlantVillage is on legal hold. Clone only after confirming intended-use rights.'
  $plantVillage = Join-Path $resolvedDataDir 'plantvillage-original'
  if (-not (Test-Path (Join-Path $plantVillage '.git'))) {
    if (Test-Path $plantVillage) {
      $status += [pscustomobject]@{ id = 'plantvillage-original'; status = 'blocked'; reason = 'Destination exists without a Git checkout; no automatic deletion or retry performed.' }
    } else {
      git clone https://github.com/spMohanty/PlantVillage-Dataset $plantVillage
      if ($LASTEXITCODE -eq 0) { $status += [pscustomobject]@{ id = 'plantvillage-original'; status = 'acquired'; reason = 'Official repository clone completed after explicit flag.' } }
      else { $status += [pscustomobject]@{ id = 'plantvillage-original'; status = 'blocked'; reason = 'git clone failed; inspect network/authentication and retry manually.' } }
    }
  } else { $status += [pscustomobject]@{ id = 'plantvillage-original'; status = 'already_present'; reason = 'Official repository checkout already exists.' } }
} else {
  Write-Host 'PlantVillage skipped: original-source license remains unresolved.'
  $status += [pscustomobject]@{ id = 'plantvillage-original'; status = 'skipped'; reason = 'Original-source license unresolved.' }
}
$status | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $statusPath -Encoding UTF8
Write-Host 'Acquisition status recorded in acquisition_status.json. Review licensing and run the read-only audit before any training.'
