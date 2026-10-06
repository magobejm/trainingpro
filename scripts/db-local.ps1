[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('up', 'down')]
  [string]$Action
)

$ErrorActionPreference = 'Stop'

$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue
$npxCmd = Get-Command npx -ErrorAction SilentlyContinue
if (-not $supabaseCmd -and -not $npxCmd) {
  throw 'No se encontro ni supabase CLI ni npx. Instala Node.js (con npx) o Supabase CLI.'
}

if ($Action -eq 'up') {
  Write-Host 'Arranca Supabase local (puerto 54322). No borra datos.'
  $supabaseArgs = @('start')
} else {
  Write-Host 'Detiene Supabase local. El volumen de datos se conserva.'
  $supabaseArgs = @('stop')
}

if ($supabaseCmd) {
  & supabase @supabaseArgs
} else {
  & npx --yes supabase@latest @supabaseArgs
}

if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
