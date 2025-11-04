# 🚀 Cómo ejecutar Syntegra

## Paso 1: Limpiar archivos obsoletos

```powershell
# Copiar y pegar todo este bloque en PowerShell
cd c:\Users\danie\Escritorio\Syntegra-App

Remove-Item backend\src\index.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\insights.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\upload.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\process.ts -ErrorAction SilentlyContinue
Remove-Item backend\tsconfig.json -ErrorAction SilentlyContinue
Remove-Item -Recurse backend\src\services -ErrorAction SilentlyContinue
Remove-Item worker\src\worker.ts -ErrorAction SilentlyContinue
Remove-Item worker\tsconfig.json -ErrorAction SilentlyContinue

Write-Host "✅ Limpieza completa"
```

## Paso 2: Reiniciar Docker

```powershell
docker compose down -v
docker compose up --build
```

## Paso 3: Abrir aplicación

- Frontend: http://localhost:5173
- Backend: http://localhost:4000/api/insights

## ✅ Verificar que funciona

1. Abrir http://localhost:5173
2. Hacer clic en cada opción del menú lateral:
   - Dashboard → Ver KPIs y gráficos
   - Data Import → Subir archivos CSV
   - Analytics → Ver tendencias
   - Reports → Generar reportes
   - Settings → Configurar sistema

## 🐛 Si hay errores

```powershell
# Reiniciar completamente
docker compose down
docker system prune -f
docker compose up --build
```

## 📝 Estructura final correcta

```
backend/src/
  ├── index.js ✅
  └── routes/
      ├── analytics.js ✅
      ├── insights.js ✅
      ├── process.js ✅
      ├── reports.js ✅
      ├── settings.js ✅
      └── upload.js ✅

frontend/src/
  ├── App.tsx ✅
  ├── components/
      ├── Layout.tsx ✅
      ├── Dashboard.tsx ✅
      ├── DataImport.tsx ✅
      ├── Analytics.tsx ✅
      ├── Reports.tsx ✅
      └── Settings.tsx ✅

worker/src/
  └── worker.js ✅
```

**NO debe haber archivos .ts en backend/ ni worker/**
