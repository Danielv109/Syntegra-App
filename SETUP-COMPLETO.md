# 🚀 Setup Completo del Sistema Syntegra

## PASO 1: Detener y limpiar todo

```powershell
cd c:\Users\danie\Escritorio\Syntegra-App
docker compose down -v
```

## PASO 2: Instalar dependencias del frontend

```powershell
cd frontend
npm install
cd ..
```

## PASO 3: Instalar dependencias del backend

```powershell
cd backend
npm install
cd ..
```

## PASO 4: Instalar dependencias del worker

```powershell
cd worker
npm install
cd ..
```

## PASO 5: Instalar dependencias del connector-worker

```powershell
cd connector-worker
npm install
cd ..
```

## PASO 6: Levantar solo la base de datos primero

```powershell
docker compose up -d db
```

Esperar 10 segundos para que PostgreSQL inicie completamente.

## PASO 7: Ejecutar migraciones

```powershell
cd backend
npm run migrate
cd ..
```

Deberías ver:

```
🔄 Running migrations...
✅ Migrations completed successfully
```

## PASO 8: Verificar tablas creadas

```powershell
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra -c "\dt"
```

Deberías ver todas estas tablas:

- clients
- messages
- connectors
- jobs
- finetuning_dataset
- reports
- client_settings
- daily_analytics
- topic_summary
- channel_summary

## PASO 9: Levantar todos los servicios

```powershell
docker compose up --build -d
```

## PASO 10: Verificar que todos los servicios estén corriendo

```powershell
docker compose ps
```

Todos los servicios deben estar en estado "running" (Up):

- syntegra-app-db-1
- syntegra-app-backend-1
- syntegra-app-worker-1
- syntegra-app-connector-worker-1
- syntegra-app-frontend-1

## PASO 11: Ver logs de cada servicio

```powershell
# Backend
docker logs syntegra-app-backend-1 -f

# Worker principal
docker logs syntegra-app-worker-1 -f

# Connector worker
docker logs syntegra-app-connector-worker-1 -f

# Frontend
docker logs syntegra-app-frontend-1 -f
```

## PASO 12: Abrir la aplicación

Abrir en el navegador: http://localhost:5173

---

## ✅ Verificación Final

### 1. Crear cliente de prueba

- Abrir http://localhost:5173
- Hacer clic en "+ Nuevo Cliente"
- Nombre: "Empresa Test"
- Industria: "Retail / E-commerce"
- Guardar

### 2. Subir datos de prueba

Crear archivo `test.csv`:

```csv
text,timestamp,channel
El producto llegó rápido y en perfecto estado,2025-01-05T10:00:00Z,whatsapp
Muy mal servicio nadie responde,2025-01-05T11:00:00Z,whatsapp
Cuánto cuesta el envío,2025-01-05T12:00:00Z,email
Excelente calidad totalmente recomendable,2025-01-05T13:00:00Z,instagram
El precio es muy alto,2025-01-05T14:00:00Z,whatsapp
```

- Ir a "Data Import"
- Subir el archivo
- Esperar procesamiento (ver progreso)

### 3. Verificar resultados

- Ir a "Dashboard" - Ver KPIs actualizados
- Ir a "Analytics" - Ver gráficos con datos reales
- Ir a "Validation" - Revisar y corregir clasificaciones
- Ir a "Data Explorer" - Ver todos los mensajes clasificados

---

## 🔧 Solución de Problemas

### Error: "relation connectors does not exist"

```powershell
cd backend
npm run migrate
cd ..
docker compose restart
```

### Error: "Cannot connect to Ollama"

Verificar que Ollama esté corriendo:

```powershell
ollama list
ollama serve
```

### Error: "Port already in use"

Detener servicios que usen los puertos:

```powershell
# Ver qué proceso usa el puerto 4000
netstat -ano | findstr :4000

# Detener Docker completamente
docker compose down
```

### Frontend no carga

```powershell
docker logs syntegra-app-frontend-1 -f
docker compose restart frontend
```

### Worker no procesa

```powershell
# Ver estado de trabajos
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra -c "SELECT * FROM jobs ORDER BY created_at DESC LIMIT 5;"

# Reiniciar worker
docker compose restart worker
```

---

## 📊 Comandos Útiles

### Ver estado de la base de datos

```powershell
# Conectar a PostgreSQL
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra

# Ver clientes
SELECT * FROM clients;

# Ver mensajes recientes
SELECT id, text, sentiment, topic FROM messages ORDER BY timestamp DESC LIMIT 10;

# Ver trabajos
SELECT id, status, total_records, processed_records FROM jobs ORDER BY created_at DESC;

# Ver resúmenes analíticos
SELECT * FROM daily_analytics ORDER BY date DESC LIMIT 10;

# Ver dataset de fine-tuning
SELECT COUNT(*) as total_corrections FROM finetuning_dataset;

# Salir
\q
```

### Reiniciar servicios específicos

```powershell
docker compose restart backend
docker compose restart worker
docker compose restart connector-worker
docker compose restart frontend
```

### Limpiar y empezar de cero

```powershell
docker compose down -v
docker volume rm syntegra-app_postgres_data
docker compose up --build -d
cd backend
npm run migrate
cd ..
```

---

## 🎯 Sistema Listo

Tu plataforma Syntegra ahora está completamente operativa con:

✅ Cola de trabajos asíncrona
✅ Procesamiento por lotes (IA)
✅ Tablas de resumen (rendimiento)
✅ Reintentos automáticos
✅ Connector worker para ingesta automática
✅ Fine-tuning dataset (base de datos de oro)
✅ TailwindCSS en todo el frontend
✅ Sistema de validación humana
✅ Generación de reportes PDF
✅ Settings persistentes

**Listo para competir con Scale AI.** 🚀
