$ErrorActionPreference = "Stop"

$containerName = "next-ai-board-postgres"
$appPort = 3000

Write-Host "1. Next.js 개발 서버 종료"

$processIds = netstat -ano |
  Select-String ":$appPort" |
  Select-String "LISTENING" |
  ForEach-Object {
    ($_ -split "\s+")[-1]
  } |
  Select-Object -Unique

if ($processIds) {
  foreach ($processId in $processIds) {
    Write-Host "3000번 포트를 사용하는 프로세스 종료: $processId"
    Stop-Process -Id $processId -Force
  }
} else {
  Write-Host "3000번 포트에서 실행 중인 서버가 없습니다."
}

Write-Host "2. PostgreSQL 컨테이너 종료"

$runningDb = docker ps --format "{{.Names}}" |
  Select-String -Pattern "^$containerName$" -Quiet

if ($runningDb) {
  docker stop $containerName | Out-Null
  Write-Host "DB 컨테이너를 종료했습니다: $containerName"
} else {
  Write-Host "실행 중인 DB 컨테이너가 없습니다."
}
