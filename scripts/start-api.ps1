[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 120,
  [switch]$Build
)

$ErrorActionPreference = "Stop"

$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repo

function Stop-PortListeners([int]$Port) {
  $pids = @()
  try {
    $tcp = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction Stop
    if ($tcp) {
      $pids = $tcp | Select-Object -ExpandProperty OwningProcess -Unique
    }
  } catch {
    $lines = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)$"
    foreach ($line in $lines) {
      if ($line.Matches.Count -gt 0) {
        $pids += [int]$line.Matches[0].Groups[1].Value
      }
    }
    $pids = $pids | Sort-Object -Unique
  }

  foreach ($procId in $pids) {
    try {
      if ($procId -ne $PID) {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "Stopped stale process on port ${Port}: PID $procId"
      }
    } catch {
      Write-Warning "Could not stop PID $procId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

function Wait-HttpReady([string]$Url, [int]$TimeoutSec) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Host "API ready ($($response.StatusCode)): $Url"
        return $true
      }
    } catch {
      Start-Sleep -Milliseconds 800
      continue
    }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

Write-Host "Stopping any stale API listener on port 8080..."
Stop-PortListeners -Port 8080

if ($Build) {
  $command = 'pnpm.cmd --filter @trainerpro/api build && pnpm.cmd --filter @trainerpro/api start'
} else {
  $command = 'pnpm.cmd --filter @trainerpro/api dev'
}

Write-Host "Starting API..."
$launch = "cd /d `"$repo`" && $command"
$proc = Start-Process cmd.exe -ArgumentList "/k", $launch -PassThru
Write-Host "API launched (PID $($proc.Id))"

$ready = Wait-HttpReady -Url "http://localhost:8080/health" -TimeoutSec $TimeoutSeconds
if (-not $ready) {
  Write-Warning "Health check timed out. The API process may still be starting — check the opened terminal."
  exit 1
}

Write-Host "API: http://localhost:8080/health"
