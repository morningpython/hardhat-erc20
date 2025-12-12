# PowerShell script to run tests (root and frontend)
Write-Host "Installing root dependencies..."
# Bypass execution policy not possible here — user may need to run Set-ExecutionPolicy
npm ci

Write-Host "Running test suite..."
npm test

Write-Host "Installing frontend dependencies..."
Set-Location frontend
npm ci

Write-Host "Running frontend build..."
npm run build

Write-Host "Done."
