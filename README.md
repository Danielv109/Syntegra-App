# Syntegra — Plataforma de Inteligencia de Cliente

Sistema profesional para análisis de datos de clientes con IA.

## 🚀 Inicio rápido

### Requisitos

- Docker Desktop instalado y ejecutándose
- Puertos 4000 y 5173 disponibles

### Instalación

1. **Levantar servicios**

```bash
cd c:\Users\danie\Escritorio\Syntegra-App
docker compose up --build
```

2. **Acceder**

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/insights
- Health: http://localhost:4000/health

### Detener servicios

```bash
docker compose down
```

### Limpiar y reiniciar (si hay problemas)

```bash
docker compose down -v
docker compose up --build --force-recreate
```

## 📁 Estructura

```
Syntegra-App/
├── backend/          # API Express + TypeScript
├── frontend/         # React + Vite + TypeScript
├── worker/           # Procesamiento asíncrono
└── docker-compose.yml
```

## 🔧 Desarrollo local (sin Docker)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Worker

```bash
cd worker
npm install
npm start
```

## 📊 Endpoints

- `GET /api/insights` - Dashboard completo
- `POST /api/upload` - Subir datos
- `GET /api/process/status/:jobId` - Estado de procesamiento

## ⚠️ Solución de problemas

### Error: Puerto en uso

```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Error: Docker no inicia

1. Verificar Docker Desktop está ejecutándose
2. Reiniciar Docker Desktop
3. Ejecutar: `docker compose down` y luego `docker compose up --build`

### Error: node_modules

```bash
# Eliminar node_modules y reinstalar
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

cd ../worker
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Características

✅ Dashboard interactivo con KPIs en tiempo real  
✅ Análisis de sentimiento por canal  
✅ Detección de temas recurrentes  
✅ Alertas críticas automáticas  
✅ Predicciones y scores  
✅ Sugerencias de acciones

## 🔐 Seguridad

Sistema diseñado para uso personal/interno sin autenticación por defecto.

---

**Sistema listo para ejecutar con `docker compose up --build`**
