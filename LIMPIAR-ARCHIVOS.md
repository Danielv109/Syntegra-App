# Archivos a eliminar

Ejecuta estos comandos en PowerShell para limpiar archivos obsoletos:

```powershell
# Backend - eliminar archivos TypeScript
Remove-Item backend\src\index.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\insights.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\upload.ts -ErrorAction SilentlyContinue
Remove-Item backend\src\routes\process.ts -ErrorAction SilentlyContinue
Remove-Item backend\tsconfig.json -ErrorAction SilentlyContinue
Remove-Item -Recurse backend\src\services -ErrorAction SilentlyContinue

# Worker - eliminar archivos TypeScript
Remove-Item worker\src\worker.ts -ErrorAction SilentlyContinue
Remove-Item worker\tsconfig.json -ErrorAction SilentlyContinue

Write-Host "✅ Archivos obsoletos eliminados"
```

O elimina manualmente desde VS Code:

- `backend/src/index.ts`
- `backend/src/routes/insights.ts`
- `backend/src/routes/upload.ts`
- `backend/src/routes/process.ts`
- `backend/tsconfig.json`
- `backend/src/services/` (carpeta completa)
- `worker/src/worker.ts`
- `worker/tsconfig.json`
