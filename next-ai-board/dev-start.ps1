$ErrorActionPreference = "Stop"

$containerName = "next-ai-board-postgres"
$dbPort = 5432
$appPort = 3000

Write-Host "1. Check PostgreSQL container"

$containerExists = docker ps -a --format "{{.Names}}" |
  Select-String -Pattern "^$containerName$" -Quiet

if ($containerExists) {
  Write-Host "Start existing DB container: $containerName"
  docker start $containerName | Out-Null
} else {
  Write-Host "Create new DB container: $containerName"
  docker run --name $containerName `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=next_ai_board `
    -p ${dbPort}:5432 `
    -d postgres:16 | Out-Null
}

Write-Host "2. Wait for DB"
$ready = $false

for ($i = 1; $i -le 20; $i++) {
  docker exec $containerName pg_isready -U postgres -d next_ai_board | Out-Null

  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }

  Start-Sleep -Seconds 1
}

if (-not $ready) {
  throw "PostgreSQL is not ready. Check Docker status."
}

Write-Host "3. Run Prisma migration"
cmd /c npx prisma migrate dev

Write-Host "4. Start Next.js dev server"
cmd /c npm run dev -- -H 0.0.0.0 -p $appPort
