# Reinstalar dependencias del frontend

Ejecuta esto en PowerShell:

```powershell
cd c:\Users\danie\Escritorio\Syntegra-App

# Detener Docker
docker compose down

# Limpiar node_modules del frontend
Remove-Item -Recurse -Force frontend\node_modules -ErrorAction SilentlyContinue
Remove-Item frontend\package-lock.json -ErrorAction SilentlyContinue

# Reinstalar
cd frontend
npm install

# Volver a raíz
cd ..

# Reconstruir y levantar
docker compose up --build
```

O simplemente reconstruye Docker (más rápido):

```powershell
docker compose down
docker compose up --build --force-recreate
```
