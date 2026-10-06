$ErrorActionPreference = 'Stop'

if ($env:CONFIRM_DB_RESET -ne 'ci-postgres') {
  Write-Host 'Rechazado. Este comando borra el volumen de Postgres de docker-compose (CI), no la base de Supabase local.'
  Write-Host "Para ejecutarlo: `$env:CONFIRM_DB_RESET='ci-postgres'; pnpm db:ci:reset"
  exit 1
}

$composeUrl = 'postgresql://postgres:postgres@localhost:5432/trainerpro_dev?sslmode=disable'
$env:DATABASE_URL = $composeUrl
$env:DIRECT_URL = $composeUrl

Write-Host 'Borrando el volumen trainerpro-postgres-data y recreando el Postgres de CI...'
docker compose down -v postgres
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm --filter @trainerpro/api db:migrate:deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
pnpm --filter @trainerpro/api db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
