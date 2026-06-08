$ErrorActionPreference = "Stop"

$containerName = "next-ai-board-postgres"
$dbPort = 5432
$appPort = 3000

Write-Host "1. PostgreSQL 컨테이너 확인"

$containerExists = docker ps -a --format "{{.Names}}" |
  Select-String -Pattern "^$containerName$" -Quiet

if ($containerExists) {
  Write-Host "기존 DB 컨테이너 시작: $containerName"
  docker start $containerName | Out-Null
} else {
  Write-Host "DB 컨테이너 새로 생성: $containerName"
  docker run --name $containerName `
    -e POSTGRES_USER=postgres `
    -e POSTGRES_PASSWORD=postgres `
    -e POSTGRES_DB=next_ai_board `
    -p ${dbPort}:5432 `
    -d postgres:16 | Out-Null
}

Write-Host "2. DB 준비 대기"
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
  throw "PostgreSQL이 준비되지 않았습니다. Docker 상태를 확인하세요."
}

Write-Host "3. Prisma 마이그레이션 실행"
cmd /c npx prisma migrate dev

Write-Host "4. Next.js 개발 서버 실행"
cmd /c npm run dev -- -H 0.0.0.0 -p $appPort
