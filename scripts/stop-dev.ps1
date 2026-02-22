[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

function Stop-PortListeners([int]$Port) {
  $lines = netstat -ano -p tcp | Select-String ":$Port\s+.*LISTENING\s+(\d+)$"
  if (-not $lines) {
    Write-Host "No listener on port $Port"
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
      Stop-Process -Id $procId -Force -ErrorAction Stop
      Write-Host "Stopped PID $procId on port $Port"
    } catch {
      Write-Warning "Could not stop PID $procId on port ${Port}: $($_.Exception.Message)"
    }
  }
}

Stop-PortListeners -Port 8080
Stop-PortListeners -Port 5173

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq "node.exe" -and
    $_.CommandLine -match "@trainerpro/api dev|@trainerpro/api start|@trainerpro/web dev|tsx watch src/main.ts|dist/main.js|vite --host 0.0.0.0 --port 5173"
  } |
  ForEach-Object {
    try {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop
      Write-Host "Stopped lingering dev process PID $($_.ProcessId)"
    } catch {
      Write-Warning "Could not stop lingering PID $($_.ProcessId): $($_.Exception.Message)"
    }
  }

Write-Host "Done."
