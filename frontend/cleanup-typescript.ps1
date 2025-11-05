# Script para eliminar TypeScript del proyecto

Write-Host "🧹 Limpiando archivos de TypeScript..." -ForegroundColor Yellow

# Eliminar archivos de configuración de TypeScript
$filesToRemove = @(
    "tsconfig.json",
    "tsconfig.node.json"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✓ Eliminado: $file" -ForegroundColor Green
    }
}

# Renombrar todos los archivos .tsx a .jsx si existen
Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | ForEach-Object {
    $newName = $_.FullName -replace '\.tsx$', '.jsx'
    Rename-Item -Path $_.FullName -NewName $newName
    Write-Host "✓ Renombrado: $($_.Name) -> $([System.IO.Path]::GetFileName($newName))" -ForegroundColor Green
}

# Renombrar todos los archivos .ts a .js si existen (excepto node_modules)
Get-ChildItem -Path "src" -Filter "*.ts" -Recurse | ForEach-Object {
    $newName = $_.FullName -replace '\.ts$', '.js'
    Rename-Item -Path $_.FullName -NewName $newName
    Write-Host "✓ Renombrado: $($_.Name) -> $([System.IO.Path]::GetFileName($newName))" -ForegroundColor Green
}

Write-Host "`n✅ Limpieza completada!" -ForegroundColor Green
Write-Host "Ahora ejecuta: npm install" -ForegroundColor Cyan
