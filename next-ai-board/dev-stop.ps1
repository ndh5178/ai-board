$ErrorActionPreference = "Stop"

$containerName = "next-ai-board-postgres"
$appPort = 3000

Write-Host "1. Stop Next.js dev server"

$processIds = netstat -ano |
  Select-String ":$appPort" |
  Select-String "LISTENING" |
  ForEach-Object {
    ($_ -split "\s+")[-1]
  } |
  Select-Object -Unique

if ($processIds) {
  foreach ($processId in $processIds) {
    Write-Host "Stop process using port 3000: $processId"
    Stop-Process -Id $processId -Force
  }
} else {
  Write-Host "No server is listening on port 3000."
}

Write-Host "2. Stop PostgreSQL container"

$runningDb = docker ps --format "{{.Names}}" |
  Select-String -Pattern "^$containerName$" -Quiet

if ($runningDb) {
  docker stop $containerName | Out-Null
  Write-Host "Stopped DB container: $containerName"
} else {
  Write-Host "No running DB container."
}
