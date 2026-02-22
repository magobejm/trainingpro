[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repo

function Test-PortListening([int]$Port) {
  $line = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)$" | Select-Object -First 1
  return [bool]$line
}

function Read-EnvVar([string]$Name) {
  $file = Join-Path $repo ".env"
  if (Test-Path $file) {
    foreach ($line in Get-Content $file) {
      $trimmed = $line.Trim()
      if ($trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) { continue }
      $parts = $trimmed.Split("=", 2)
      if ($parts[0] -eq $Name) { return $parts[1] }
    }
  }
  return $null
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) { $dbUrl = Read-EnvVar -Name "DATABASE_URL" }

$dbPort = 54322
if ($dbUrl -match ":(\d+)/") {
    $dbPort = [int]$matches[1]
}

Write-Output ""
Write-Output "=== Status de Servicios Dev ==="

$api = Test-PortListening -Port 8080
$web = Test-PortListening -Port 5173
$db = Test-PortListening -Port $dbPort

if ($api) { Write-Host "[OK]   API está corriendo (Puerto 8080)" -ForegroundColor Green }
else { Write-Host "[FAIL] API NO está corriendo (Puerto 8080)" -ForegroundColor Red }

if ($web) { Write-Host "[OK]   Web está corriendo (Puerto 5173)" -ForegroundColor Green }
else { Write-Host "[FAIL] Web NO está corriendo (Puerto 5173)" -ForegroundColor Red }

if ($db)  { Write-Host "[OK]   DB está corriendo (Puerto $dbPort)"  -ForegroundColor Green }
else { Write-Host "[FAIL] DB NO está corriendo (Puerto $dbPort)"  -ForegroundColor Red }

Write-Output "==============================="
Write-Output ""
