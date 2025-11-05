# 🏗️ ARQUITECTURA LIMPIA - SYNTEGRA

## ESTRUCTURA DE ARCHIVOS (LIMPIA)

```
Syntegra-App/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js          ← Pool de PostgreSQL
│   │   │   └── migrate.js             ← Migraciones de BD
│   │   ├── routes/
│   │   │   ├── clients.js             ← CRUD de clientes
│   │   │   ├── insights.js            ← Dashboard KPIs
│   │   │   ├── analytics.js           ← Analytics avanzados
│   │   │   ├── validation.js          ← Validación humana + fine-tuning
│   │   │   ├── messages.js            ← Data Explorer
│   │   │   ├── connectors.js          ← CRUD de conectores
│   │   │   ├── upload.js              ← Upload CSV (crea jobs)
│   │   │   ├── process.js             ← Status de jobs
│   │   │   ├── reports.js             ← Generación de PDFs
│   │   │   └── settings.js            ← Configuración persistente
│   │   ├── services/                  ← ❌ ELIMINADO (código muerto)
│   │   └── index.js                   ← Servidor Express
│   └── package.json
│
├── worker/
│   ├── src/
│   │   ├── worker.js                  ← Procesador de jobs (única copia)
│   │   └── ai-classifier.js           ← ✅ ÚNICA COPIA (usada por worker)
│   └── package.json
│
├── connector-worker/
│   ├── src/
│   │   └── connector-worker.js        ← Extractor de APIs
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/                ← 16 componentes con Tailwind
    │   ├── index.css                  ← Tailwind base
    │   ├── App.jsx                    ← Router principal
    │   └── main.jsx                   ← Entry point
    └── package.json
```

---

## FLUJO DE CLASIFICACIÓN DE IA

```
┌─────────────────────────────────────────────────────────┐
│  CLASIFICACIÓN DE MENSAJES CON IA                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. CSV Upload / API Connector                         │
│     ↓                                                   │
│  2. Job creado en tabla `jobs`                         │
│     ↓                                                   │
│  3. Worker toma job                                    │
│     ↓                                                   │
│  4. worker/src/ai-classifier.js                        │
│     - classifyMessagesBatch()                          │
│     - Procesa en lotes de 50                           │
│     - Usa OpenAI o Ollama según .env                   │
│     ↓                                                   │
│  5. Mensajes clasificados guardados en `messages`      │
│     ↓                                                   │
│  6. Tablas de resumen actualizadas                     │
│     - daily_analytics                                  │
│     - topic_summary                                    │
│     - channel_summary                                  │
│     ↓                                                   │
│  7. Job marcado como `completed`                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## CÓDIGO ELIMINADO (MUERTO)

### ❌ backend/src/services/ai-classifier.js

- **Razón:** Duplicado exacto de worker/src/ai-classifier.js
- **Problema:** Nunca fue importado por ninguna ruta
- **Solución:** Eliminado completamente

### ❌ backend/src/services/pdf-generator.js

- **Estado:** Movido a backend/src/routes/reports.js
- **Razón:** Solo usado por reports.js, no necesita estar separado

### ❌ backend/src/services/alert-engine.js

- **Estado:** Movido inline a backend/src/routes/insights.js
- **Razón:** Solo usado por insights.js

---

## REGLAS DE MANTENIMIENTO

### ✅ ÚNICA FUENTE DE VERDAD

**Clasificación de IA:**

- Archivo: `worker/src/ai-classifier.js`
- Usado por: `worker/src/worker.js`
- Cambios: Solo editar este archivo

**Base de Datos:**

- Archivo: `backend/src/db/migrate.js`
- Cambios: Crear nueva migración, nunca editar migraciones existentes

**Tablas de Resumen:**

- Actualización: Solo en `worker/src/worker.js` (función updateAnalyticsSummaries)
- Lectura: Todas las rutas (insights.js, analytics.js, reports.js)

---

## REGLAS DE NEGOCIO - CONECTORES

### ❌ INCORRECTO (Antes)

```javascript
// POST /api/connectors/:id/test
// Problema: Modificaba status = 'active' y last_sync
await pool.query(
  "UPDATE connectors SET status = 'active', last_sync = NOW() WHERE id = $1"
);
```

### ✅ CORRECTO (Ahora)

```javascript
// POST /api/connectors/:id/test
// Solo valida credenciales, NO modifica estado
if (testResult) {
  res.json({ success: true, message: "Credenciales válidas" });
  // NO actualiza base de datos
}
```

### Responsabilidades Claras

**Prueba de Conexión (connectors.js):**

- ✅ Valida credenciales API
- ✅ Retorna success/failure
- ❌ NO modifica `status`
- ❌ NO modifica `last_sync`

**Sincronización Real (connector-worker.js):**

- ✅ Extrae mensajes de APIs
- ✅ Actualiza `status` = 'active' | 'error'
- ✅ Actualiza `last_sync`
- ✅ Crea jobs en tabla `jobs`

---

## FLUJO DE CONECTORES

```
┌─────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO DE CONECTORES                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Usuario crea conector (POST /api/connectors)       │
│     Estado inicial: enabled=false, status='inactive'   │
│     ↓                                                   │
│  2. Usuario prueba credenciales (POST /:id/test)       │
│     - Valida API key                                   │
│     - NO modifica BD                                   │
│     - Solo informa si son válidas                      │
│     ↓                                                   │
│  3. Usuario activa conector (PUT /:id/toggle)          │
│     Estado: enabled=true, status='inactive'            │
│     ↓                                                   │
│  4. Connector-worker detecta conector activo           │
│     - Lee enabled=true                                 │
│     - Verifica frecuencia                              │
│     ↓                                                   │
│  5. Connector-worker extrae mensajes                   │
│     - Llama a API externa                              │
│     - Si éxito: status='active', last_sync=NOW()       │
│     - Si falla: status='error'                         │
│     ↓                                                   │
│  6. Connector-worker encola job                        │
│     - Crea job tipo 'api_ingest'                       │
│     - Payload con mensajes extraídos                   │
│     ↓                                                   │
│  7. Worker principal procesa job                       │
│     - Clasifica con IA                                 │
│     - Guarda en messages                               │
│     - Actualiza tablas de resumen                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ESTADOS DE CONECTORES

| Estado     | Significado                    | Quién lo establece |
| ---------- | ------------------------------ | ------------------ |
| `inactive` | Recién creado o desactivado    | Usuario (POST/PUT) |
| `active`   | Sincronizando exitosamente     | connector-worker   |
| `error`    | Falla en última sincronización | connector-worker   |

**IMPORTANTE:** El botón "Probar" NO cambia el estado. Solo valida credenciales.

---

## DEPENDENCIAS POR SERVICIO

### Backend

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "pg": "^8.11.3",
  "axios": "^1.6.2",
  "pdfkit": "^0.15.0",
  "multer": "^1.4.5-lts.1",
  "csv-parser": "^3.0.0"
}
```

### Worker

```json
{
  "dotenv": "^16.3.1",
  "pg": "^8.11.3",
  "axios": "^1.6.2",
  "csv-parser": "^3.0.0"
}
```

### Connector-Worker

```json
{
  "dotenv": "^16.3.1",
  "pg": "^8.11.3",
  "axios": "^1.6.2"
}
```

### Frontend

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "recharts": "^2.10.3",
  "axios": "^1.6.2",
  "tailwindcss": "^3.4.1",
  "postcss": "^8.4.33",
  "autoprefixer": "^10.4.17"
}
```

---

## VARIABLES DE ENTORNO

### Requeridas

```bash
POSTGRES_HOST=db
POSTGRES_USER=syntegra
POSTGRES_PASSWORD=syntegra
POSTGRES_DB=syntegra
```

### Opcional - IA

```bash
# Opción 1: OpenAI (recomendado para producción)
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...

# Opción 2: Ollama (local, gratis)
AI_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434/api/generate
OLLAMA_MODEL=deepseek-r1:14b
```

---

## COMANDOS DE MANTENIMIENTO

### Limpiar código muerto

```powershell
cd backend\src
Remove-Item -Path "services" -Recurse -Force
```

### Ver estructura limpia

```powershell
tree /F /A backend\src
tree /F /A worker\src
tree /F /A connector-worker\src
```

### Buscar imports obsoletos

```powershell
Get-ChildItem -Path backend\src -Filter "*.js" -Recurse | Select-String -Pattern "services/ai-classifier"
```

---

## CHECKLIST DE LIMPIEZA

- [x] Eliminar `backend/src/services/ai-classifier.js`
- [x] Eliminar `backend/src/services/pdf-generator.js`
- [x] Eliminar `backend/src/services/alert-engine.js`
- [x] Eliminar carpeta `backend/src/services/`
- [x] Verificar que worker tiene única copia de ai-classifier.js
- [x] Documentar arquitectura limpia
- [x] Actualizar README con nueva estructura

---

## 🎯 ESTADO FINAL

```
┌────────────────────────────────────────────────┐
│  ARQUITECTURA LIMPIA Y MANTENIBLE             │
├────────────────────────────────────────────────┤
│  ✅ Cero código duplicado                     │
│  ✅ Cero código muerto                        │
│  ✅ Única fuente de verdad por funcionalidad  │
│  ✅ Separación clara de responsabilidades     │
│  ✅ 100% documentado                          │
└────────────────────────────────────────────────┘
```

**Sistema listo para escalar y mantener.** 🚀
