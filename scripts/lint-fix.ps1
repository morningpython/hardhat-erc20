# PowerShell script to run Prettier and ESLint autofix
Write-Host "Running Prettier format..."
npx prettier --write .
Write-Host "Running ESLint autofix..."
npx eslint . --ext .js,.jsx,.ts,.tsx --fix
Write-Host "Done. You may still need to manually address some lint warnings/errors."
