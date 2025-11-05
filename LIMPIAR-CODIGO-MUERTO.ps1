Write-Host "🧹 LIMPIANDO CÓDIGO MUERTO Y DUPLICADO" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$cleaned = $false

# 1. Eliminar carpeta services del backend
if (Test-Path "backend\src\services") {
    Write-Host "`n📁 Eliminando backend\src\services (código muerto)..." -ForegroundColor Yellow
    Remove-Item -Path "backend\src\services" -Recurse -Force
    Write-Host "✅ Carpeta services eliminada" -ForegroundColor Green
    $cleaned = $true
} else {
    Write-Host "`n✓ backend\src\services ya está limpio" -ForegroundColor Green
}

# 2. Verificar que worker tiene ai-classifier.js
if (Test-Path "worker\src\ai-classifier.js") {
    Write-Host "✓ worker\src\ai-classifier.js existe (única copia)" -ForegroundColor Green
} else {
    Write-Host "❌ FALTA worker\src\ai-classifier.js" -ForegroundColor Red
}

# 3. Buscar imports obsoletos
Write-Host "`n🔍 Buscando imports obsoletos..." -ForegroundColor Yellow
$obsoleteImports = Get-ChildItem -Path "backend\src" -Filter "*.js" -Recurse | Select-String -Pattern "services/" -ErrorAction SilentlyContinue

if ($obsoleteImports) {
    Write-Host "⚠️ Se encontraron imports obsoletos:" -ForegroundColor Yellow
    $obsoleteImports | ForEach-Object {
        Write-Host "  - $($_.Filename): línea $($_.LineNumber)" -ForegroundColor Red
    }
} else {
    Write-Host "✓ No hay imports obsoletos" -ForegroundColor Green
}

# 4. Verificar archivos TypeScript fantasma
Write-Host "`n🔍 Verificando archivos TypeScript..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem -Path "frontend" -Include "tsconfig*.json","*.ts","*.tsx" -Recurse -Exclude "node_modules" -ErrorAction SilentlyContinue

if ($tsFiles) {
    Write-Host "⚠️ Se encontraron archivos TypeScript:" -ForegroundColor Yellow
    $tsFiles | ForEach-Object { Write-Host "  - $($_.FullName)" -ForegroundColor Red }
} else {
    Write-Host "✓ No hay archivos TypeScript" -ForegroundColor Green
}

# 5. Resumen
Write-Host "`n======================================" -ForegroundColor Cyan
if ($cleaned) {
    Write-Host "✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
    Write-Host "   Ejecuta: docker compose restart backend" -ForegroundColor Cyan
} else {
    Write-Host "✅ TODO LIMPIO" -ForegroundColor Green
}
Write-Host "======================================" -ForegroundColor Cyan
