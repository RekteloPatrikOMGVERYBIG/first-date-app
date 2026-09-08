param([ValidateSet('start', 'show', 'migrate', 'check')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot '.env.postgres'
if (-not (Test-Path -LiteralPath $configPath)) { throw 'Run backend/setup-postgres.ps1 first.' }
$configLine = Get-Content -LiteralPath $configPath | Where-Object { $_.StartsWith('POSTGRES_PASSWORD=') }
$dbPassword = $configLine.Substring('POSTGRES_PASSWORD='.Length)
$previousDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = 'postgresql+psycopg://dateplanner:' + [uri]::EscapeDataString($dbPassword) + '@127.0.0.1:5433/first_date'
$pythonPath = Join-Path $PSScriptRoot '.venv/Scripts/python.exe'
try {
    switch ($Action) {
        'start' { & $pythonPath -m uvicorn app.main:app --app-dir $PSScriptRoot --host 127.0.0.1 --port 8000 }
        'show' { & $pythonPath (Join-Path $PSScriptRoot 'show_responses.py') }
        'migrate' { & $pythonPath (Join-Path $PSScriptRoot 'migrate_to_postgres.py') --apply }
        'check' { & $pythonPath (Join-Path $PSScriptRoot 'migrate_to_postgres.py') }
    }
    if ($LASTEXITCODE -ne 0) { throw 'Operation failed. See the output above.' }
} finally {
    $env:DATABASE_URL = $previousDatabaseUrl
}
