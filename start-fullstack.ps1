# Start full stack: run migrations, then open backend and frontend dev servers in new PowerShell windows.
# Run this from the repository root.

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $repoRoot 'backend'
$frontend = Join-Path $repoRoot 'frontend'

Write-Host "Running database migrations..."
Push-Location $backend
npm run db:migrate
$exit = $LASTEXITCODE
if ($exit -ne 0) { Write-Error "Migrations failed with exit code $exit. Fix DB and re-run create-db.ps1, then retry."; Pop-Location; exit $exit }
Pop-Location

Write-Host "Starting backend dev server in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$frontend'; npm run dev"

Write-Host "Both servers started in separate windows. Frontend: http://127.0.0.1:5173  Backend: http://127.0.0.1:3000"