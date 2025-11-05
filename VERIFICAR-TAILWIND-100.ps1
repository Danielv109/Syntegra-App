Write-Host "🔍 VERIFICACIÓN COMPLETA DE TAILWIND CSS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$componentsPath = "frontend\src\components"
$totalFiles = 0
$filesWithInlineStyles = @()
$cleanFiles = @()

Write-Host "`n📂 Escaneando componentes..." -ForegroundColor Yellow

Get-ChildItem -Path $componentsPath -Filter "*.jsx" -Recurse | ForEach-Object {
    $totalFiles++
    $content = Get-Content $_.FullName -Raw
    
    if ($content -match 'style=\{\{') {
        $matches = ([regex]'style=\{\{').Matches($content)
        $filesWithInlineStyles += @{
            Name = $_.Name
            Path = $_.FullName
            Count = $matches.Count
        }
        Write-Host "❌ $($_.Name) - $($matches.Count) estilos inline" -ForegroundColor Red
    } else {
        $cleanFiles += $_.Name
        Write-Host "✅ $($_.Name) - 100% Tailwind" -ForegroundColor Green
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total de componentes: $totalFiles" -ForegroundColor White
Write-Host "✅ Componentes limpios: $($cleanFiles.Count)" -ForegroundColor Green
Write-Host "❌ Componentes con estilos inline: $($filesWithInlineStyles.Count)" -ForegroundColor Red

if ($filesWithInlineStyles.Count -eq 0) {
    Write-Host "`n🎉 PERFECTO: 100% TAILWIND CSS" -ForegroundColor Green
    Write-Host "No se encontraron estilos inline en ningún componente" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ ARCHIVOS QUE NECESITAN REFACTOR:" -ForegroundColor Yellow
    $filesWithInlineStyles | ForEach-Object {
        Write-Host "  - $($_.Name) ($($_.Count) estilos)" -ForegroundColor Red
    }
}

# Verificar archivos TypeScript fantasma
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🔍 VERIFICACIÓN DE ARCHIVOS TYPESCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tsFiles = @()
$tsFiles += Get-ChildItem -Path "frontend" -Filter "tsconfig*.json" -ErrorAction SilentlyContinue
$tsFiles += Get-ChildItem -Path "frontend" -Filter "*.ts" -Recurse -Exclude "node_modules" -ErrorAction SilentlyContinue
$tsFiles += Get-ChildItem -Path "frontend" -Filter "*.tsx" -Recurse -Exclude "node_modules" -ErrorAction SilentlyContinue

if ($tsFiles.Count -eq 0) {
    Write-Host "✅ No se encontraron archivos TypeScript" -ForegroundColor Green
} else {
    Write-Host "❌ Archivos TypeScript encontrados:" -ForegroundColor Red
    $tsFiles | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Red }
}

Write-Host "`n========================================" -ForegroundColor Cyan
