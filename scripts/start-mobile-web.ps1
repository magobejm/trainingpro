[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$repo = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repo

Write-Output "Starting Mobile Web (Expo on port 19006)..."

pnpm.cmd --filter @trainerpro/mobile run dev
