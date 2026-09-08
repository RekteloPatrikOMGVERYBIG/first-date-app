$ErrorActionPreference = 'Stop'
$projectPath = Split-Path $PSScriptRoot -Parent
$configPath = Join-Path $PSScriptRoot '.env.postgres'
if (-not (Test-Path -LiteralPath $configPath)) {
    $dbPassword = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
    [IO.File]::WriteAllText($configPath, "POSTGRES_PASSWORD=$dbPassword`n")
}
docker info --format '{{.ServerVersion}}' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Open Docker Desktop, wait for Engine running, then run this script again.' }
docker compose --env-file $configPath -f (Join-Path $projectPath 'compose.yaml') up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL did not start. Check the Docker output above.' }
Write-Host 'PostgreSQL is ready on 127.0.0.1:5433. Credentials: backend/.env.postgres (do not share).'
