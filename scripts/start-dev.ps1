[CmdletBinding()]
param(
  [int]$TimeoutSeconds = 240
)

$ErrorActionPreference = "Stop"

$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repo

$runDir = Join-Path $repo ".run"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

function Read-EnvVar([string]$Name) {
  $candidateFiles = @(
    (Join-Path $repo ".env.local"),
    (Join-Path $repo ".env"),
    (Join-Path $repo "apps/api/.env.local"),
    (Join-Path $repo "apps/api/.env"),
    (Join-Path $repo "prisma/.env")
  )
  foreach ($file in $candidateFiles) {
    if (-not (Test-Path $file)) {
      continue
    }
    foreach ($line in Get-Content $file) {
      $trimmed = $line.Trim()
      if ($trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
        continue
      }
      $parts = $trimmed.Split("=", 2)
      if ($parts[0] -eq $Name) {
        return $parts[1]
      }
    }
  }
  return $null
}

function Parse-DatabaseTarget([string]$DatabaseUrl) {
  try {
    $uri = [System.Uri]::new($DatabaseUrl)
    return @{
      Host = $uri.Host
      Port = $uri.Port
    }
  } catch {
    return $null
  }
}

function Test-TcpPort([string]$TargetHost, [int]$Port, [int]$TimeoutMs = 1200) {
  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $ar = $client.BeginConnect($TargetHost, $Port, $null, $null)
    if (-not $ar.AsyncWaitHandle.WaitOne($TimeoutMs)) {
      return $false
    }
    $client.EndConnect($ar)
    return $true
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Stop-PortListeners([int]$Port) {
  $lines = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)$"
  if (-not $lines) {
    return
  }
  $pids = @()
  foreach ($line in $lines) {
    if ($line.Matches.Count -gt 0) {
      $pids += [int]$line.Matches[0].Groups[1].Value
    }
  }
  $pids = $pids | Sort-Object -Unique
  foreach ($procId in $pids) {
    try {
      if ($procId -ne $PID) {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Output "Stopped stale process on port ${Port}: PID $procId"
      }
    } catch {
      Write-Warning "Could not stop PID $procId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

function Wait-HttpReady([string]$Name, [string]$Url, [int]$TimeoutSec) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        Write-Output "$Name ready ($($response.StatusCode)): $Url"
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

function Start-DevService([string]$Name, [string]$Command, [string]$ReadyUrl) {
  $command = "cd /d `"$repo`" && $Command"
  $proc = Start-Process cmd.exe -ArgumentList "/k", $command -PassThru

  Write-Output "$Name launching (PID $($proc.Id))"
  if (Wait-HttpReady -Name $Name -Url $ReadyUrl -TimeoutSec $TimeoutSeconds) {
    return @{
      Ok = $true
      Process = $proc
    }
  }

  return @{
    Ok = $false
    Process = $proc
  }
}

function Test-PortListening([int]$Port) {
  $line = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)$" | Select-Object -First 1
  return [bool]$line
}

function Wait-TcpReady([string]$TargetHost, [int]$Port, [int]$TimeoutSec = 45) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-TcpPort -TargetHost $TargetHost -Port $Port) {
      return $true
    }
    Start-Sleep -Milliseconds 800
  }
  return $false
}

function Start-DatabaseStackIfPossible([hashtable]$Target) {
  if (-not $Target) {
    return $false
  }

  $localHosts = @("127.0.0.1", "localhost", "::1")
  if ($Target.Host -notin $localHosts) {
    return $false
  }

  if ($Target.Port -eq 54322) {
    $supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
    $npxCmd = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $supabaseCmd -and -not $npxCmd) {
      throw "No se encontro ni supabase CLI ni npx. Instala Node.js (con npx) o Supabase CLI."
    }

    $useNpx = -not [bool]$supabaseCmd
    function Invoke-Supabase([string]$Action) {
      if ($useNpx) {
        & npx supabase@latest $Action
      } else {
        & supabase $Action
      }
    }

    if ($useNpx) {
      Write-Output "Database unreachable at $($Target.Host):$($Target.Port). Attempting: npx supabase@latest start"
    } else {
      Write-Output "Database unreachable at $($Target.Host):$($Target.Port). Attempting: supabase start"
    }
    Invoke-Supabase -Action "start"

    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Supabase start failed. Trying automatic recovery: stop + start."
      Invoke-Supabase -Action "stop"
      Invoke-Supabase -Action "start"
      if ($LASTEXITCODE -ne 0) {
        throw "No se pudo arrancar Supabase. Verifica Docker Desktop (Engine running) y ejecuta manualmente: npx supabase@latest start --debug"
      }
    }

    return $true
  }

  return $false
}

Write-Output "Preparing clean start for API/Web/Mobile..."

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
  $dbUrl = Read-EnvVar -Name "DATABASE_URL"
}
if ($dbUrl) {
  $target = Parse-DatabaseTarget -DatabaseUrl $dbUrl
  if ($target -and -not (Test-TcpPort -TargetHost $target.Host -Port $target.Port)) {
    $started = Start-DatabaseStackIfPossible -Target $target
    if ($started) {
      if (-not (Wait-TcpReady -TargetHost $target.Host -Port $target.Port -TimeoutSec 60)) {
        throw "Database still unreachable at $($target.Host):$($target.Port) after auto-start."
      }
    } else {
      throw "Database is unreachable at $($target.Host):$($target.Port). Start your local DB/Supabase stack first."
    }
  }
}

Stop-PortListeners -Port 8080
Stop-PortListeners -Port 5173
Stop-PortListeners -Port 19006

$api = Start-DevService -Name "API" -Command "pnpm.cmd --filter @trainerpro/api build && pnpm.cmd --filter @trainerpro/api start" -ReadyUrl "http://localhost:8080/health"
$web = Start-DevService -Name "WEB" -Command "pnpm.cmd --filter @trainerpro/web dev" -ReadyUrl "http://localhost:5173"
$mobile = Start-DevService -Name "MOBILE" -Command "pnpm.cmd --filter @trainerpro/mobile dev" -ReadyUrl "http://localhost:19006"

if (-not $api.Ok -or -not $web.Ok -or -not $mobile.Ok) {
  if ((Test-PortListening -Port 8080) -and (Test-PortListening -Port 5173) -and (Test-PortListening -Port 19006)) {
    Write-Warning "Readiness timeout reached, but ports 8080, 5173 and 19006 are listening. Continuing."
    exit 0
  }
  Write-Output ""
  throw "Start failed. Check the opened API/WEB/MOBILE terminals."
}

Write-Output ""
Write-Output "All services ready."
Write-Output "API: http://localhost:8080/health"
Write-Output "WEB: http://localhost:5173"
Write-Output "MOBILE: http://localhost:19006"
Write-Output "Logs: $runDir"
