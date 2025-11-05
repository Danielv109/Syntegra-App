Write-Host "🔍 Verificando estilos inline en componentes..." -ForegroundColor Yellow

$componentsPath = "frontend\src\components"
$files = Get-ChildItem -Path $componentsPath -Filter "*.jsx" -Recurse

$filesWithInlineStyles = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'style=\{\{') {
        $filesWithInlineStyles += $file.Name
        $matches = ([regex]'style=\{\{').Matches($content)
        Write-Host "❌ $($file.Name) - $($matches.Count) estilos inline encontrados" -ForegroundColor Red
    }
}

if ($filesWithInlineStyles.Count -eq 0) {
    Write-Host "`n✅ PERFECTO: No se encontraron estilos inline en ningún componente!" -ForegroundColor Green
    Write-Host "✅ Todos los componentes usan TailwindCSS 100%" -ForegroundColor Green
} else {
    Write-Host "`n⚠️ TOTAL: $($filesWithInlineStyles.Count) archivos con estilos inline" -ForegroundColor Yellow
    Write-Host "Archivos que necesitan refactor:" -ForegroundColor Yellow
    $filesWithInlineStyles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
