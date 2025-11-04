# 🚀 Cómo Activar Datos Reales en Syntegra

## 1️⃣ ELEGIR PROVEEDOR DE IA

### OPCIÓN A: OpenAI (RECOMENDADO)

**Ventajas:**

- ✅ Mejor precisión (95%+)
- ✅ Rápido (~200ms por mensaje)
- ✅ No requiere instalación local
- ✅ Económico: $0.15 por 1M tokens (gpt-4o-mini)

**Pasos:**

1. Ir a https://platform.openai.com/api-keys
2. Crear API key
3. Editar `.env` y poner:
   ```
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-TU_CLAVE_AQUI
   ```

### OPCIÓN B: Ollama (GRATIS, local)

**Ventajas:**

- ✅ Totalmente gratis
- ✅ Privacidad 100% (todo local)
- ✅ Sin límites de uso

**Desventajas:**

- ⚠️ Más lento (~2-5 segundos por mensaje)
- ⚠️ Requiere buena GPU o CPU potente
- ⚠️ Precisión ~85% (vs 95% OpenAI)

**Pasos:**

1. Instalar Ollama: https://ollama.com/download
2. Ejecutar en terminal:
   ```bash
   ollama pull llama3.2
   # o: ollama pull mistral
   ```
3. Editar `.env` y poner:
   ```
   AI_PROVIDER=ollama
   OLLAMA_URL=http://localhost:11434/api/generate
   OLLAMA_MODEL=llama3.2
   ```

---

## 2️⃣ INICIALIZAR BASE DE DATOS

```powershell
cd c:\Users\danie\Escritorio\Syntegra-App

# Levantar servicios
docker compose up -d

# Esperar 10 segundos para que PostgreSQL inicie

# Ejecutar migraciones
cd backend
npm install
npm run migrate
cd ..
```

**Verificar que funcionó:**

```powershell
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra -c "\dt"
```

Deberías ver: `clients`, `messages`, `connectors`

---

## 3️⃣ CREAR PRIMER CLIENTE

```powershell
# Abrir http://localhost:5173
# 1. Hacer clic en "+ Nuevo Cliente"
# 2. Nombre: "Mi Empresa Test"
# 3. Industria: "Retail"
# 4. Guardar
```

O via API:

```bash
curl -X POST http://localhost:4000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"name":"Mi Empresa Test","industry":"retail"}'
```

---

## 4️⃣ SUBIR PRIMER CSV CON DATOS REALES

Crear archivo `test_data.csv`:

```csv
text,timestamp
El producto llegó rápido y en perfecto estado,2025-01-04T10:00:00Z
Muy mal servicio, nadie responde,2025-01-04T11:00:00Z
¿Cuánto cuesta el envío a provincia?,2025-01-04T12:00:00Z
Excelente calidad, lo recomiendo,2025-01-04T13:00:00Z
```

En la UI:

1. Seleccionar cliente
2. Ir a "Data Import"
3. Seleccionar canal (ej: WhatsApp)
4. Subir `test_data.csv`
5. Hacer clic en "Subir archivo"

**Esperar ~10-30 segundos** (depende de la IA)

---

## 5️⃣ VERIFICAR QUE FUNCIONA

### Dashboard:

- Ir a "Dashboard"
- Deberías ver KPIs reales (ej: "4 Clientes analizados")

### Data Explorer:

- Ir a "Data Explorer"
- Deberías ver tus 4 mensajes con clasificaciones:
  - Sentimiento: positive/negative/neutral
  - Tema: entrega/precio/calidad/atencion
  - Intención: queja/consulta/elogio

### Validation:

- Ir a "Validation"
- Si algún mensaje fue marcado como "requires_validation: true"
- Podrás corregir la clasificación de la IA

---

## 6️⃣ CONECTAR FUENTES AUTOMÁTICAS (AVANZADO)

### WhatsApp Business API:

1. Ir a "Connectors"
2. Crear conector tipo "WhatsApp Business API"
3. Pegar API key de Meta
4. Activar conector
5. Los mensajes se importarán automáticamente cada hora

### Gmail:

1. Crear conector tipo "Gmail API"
2. Usar OAuth o API key de Google Cloud
3. Filtrar por etiqueta (ej: "soporte")

---

## 🔥 RESUMEN DE ARQUITECTURA

```
CSV Upload → Backend → IA (OpenAI/Ollama) → PostgreSQL → Frontend

Flujo:
1. Usuario sube CSV en "Data Import"
2. Backend recibe datos
3. Backend llama a OpenAI/Ollama para clasificar cada mensaje
4. Resultados se guardan en PostgreSQL
5. Frontend consulta datos reales desde PostgreSQL
6. Ya NO hay datos mock
```

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Cuánto cuesta OpenAI?**
R: ~$0.15 USD por 1M tokens. Para 1000 mensajes ≈ $0.03 USD

**P: ¿Ollama necesita GPU?**
R: No, pero será más lento. Con GPU NVIDIA: ~2s/mensaje. Sin GPU: ~5-8s/mensaje.

**P: ¿Puedo cambiar de OpenAI a Ollama después?**
R: Sí, solo cambiar `AI_PROVIDER` en `.env` y reiniciar backend.

**P: ¿Los datos antiguos se pierden?**
R: No, están en PostgreSQL. Se mantienen aunque cambies de IA.

**P: ¿Cómo mejoro la precisión?**
R: Usa "Validation" para corregir errores. El sistema aprende de tus correcciones.

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "OPENAI_API_KEY no configurada"

→ Editar `.env` y poner tu API key

### Error: "Cannot connect to database"

→ `docker compose restart db`

### Error: "Ollama no responde"

→ Verificar que Ollama está corriendo: `ollama list`

### Mensajes no aparecen en Dashboard

→ Verificar en Data Explorer primero
→ Puede tomar 30s en procesar

---

**Sistema listo para producción con datos reales y clasificación IA real.** 🎉
