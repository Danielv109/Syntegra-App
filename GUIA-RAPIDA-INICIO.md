# 🚀 Sistema Iniciado - Próximos Pasos

## ✅ Lo que ya está funcionando:

- PostgreSQL con tablas creadas (clients, messages, connectors)
- Backend corriendo en puerto 4000
- Frontend corriendo en puerto 5173
- Worker activo

---

## 🔑 PASO 1: Configurar IA (CRÍTICO)

Abre el archivo `.env` en la raíz del proyecto y elige UNA opción:

### OPCIÓN A: OpenAI (RECOMENDADO - Mejor precisión)

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-TU_CLAVE_AQUI
```

**Cómo obtener la clave:**

1. Ir a https://platform.openai.com/api-keys
2. Crear cuenta o iniciar sesión
3. Hacer clic en "Create new secret key"
4. Copiar la clave (empieza con `sk-proj-` o `sk-`)
5. Pegarla en `.env`

**Costo:** ~$0.15 por 1000 mensajes (muy barato)

### OPCIÓN B: Ollama (GRATIS - Local)

```env
AI_PROVIDER=ollama
OLLAMA_URL=http://host.docker.internal:11434/api/generate
OLLAMA_MODEL=llama3.2
```

**Pasos para Ollama:**

1. Descargar e instalar: https://ollama.com/download
2. Abrir terminal nueva y ejecutar:
   ```bash
   ollama pull llama3.2
   ```
3. Verificar que funciona:
   ```bash
   ollama list
   ```

---

## 🔄 PASO 2: Reiniciar Backend

```powershell
docker compose restart backend
```

Esperar 5 segundos y verificar logs:

```powershell
docker logs syntegra-app-backend-1
```

Deberías ver: `🚀 Backend running on port 4000`

---

## 🌐 PASO 3: Abrir la Aplicación

Abrir en tu navegador: **http://localhost:5173**

Deberías ver la pantalla "Gestión de Clientes" (vacía)

---

## 👤 PASO 4: Crear Tu Primer Cliente

En la aplicación web:

1. Hacer clic en botón **"+ Nuevo Cliente"**
2. Llenar:
   - **Nombre:** "Mi Empresa Test"
   - **Industria:** Seleccionar "Retail / E-commerce"
3. Hacer clic en **"Crear Cliente"**
4. Verás una tarjeta con el nuevo cliente
5. **Hacer clic en la tarjeta** para entrar al dashboard

---

## 📊 PASO 5: Subir Tus Primeros Datos

Una vez dentro del cliente:

1. Hacer clic en **"Data Import"** en el sidebar
2. Crear un archivo CSV en tu escritorio llamado `test.csv`:

```csv
text,timestamp
El producto llegó rápido y en perfecto estado,2025-01-05T10:00:00Z
Muy mal servicio, nadie me responde,2025-01-05T11:00:00Z
¿Cuánto cuesta el envío a provincia?,2025-01-05T12:00:00Z
Excelente calidad, totalmente recomendable,2025-01-05T13:00:00Z
El precio es muy alto para lo que es,2025-01-05T14:00:00Z
```

3. En la app:

   - **Canal:** Seleccionar "WhatsApp"
   - **Archivo CSV:** Subir tu `test.csv`
   - Hacer clic en **"Subir archivo"**

4. **ESPERAR 10-30 segundos** (la IA está analizando)

5. Deberías ver: ✅ "File uploaded and processing started (5 registros)"

---

## 🔍 PASO 6: Ver los Resultados

### Dashboard:

- Hacer clic en **"Dashboard"** en el sidebar
- Verás KPIs actualizados con datos reales

### Data Explorer:

- Hacer clic en **"Data Explorer"**
- Verás tus 5 mensajes clasificados:
  - Sentimiento (positivo/neutral/negativo)
  - Tema (entrega/precio/calidad/atención)
  - Intención (queja/consulta/elogio)

### Validation (si hay mensajes críticos):

- Hacer clic en **"Validation"**
- Si la IA marcó algún mensaje como "requiere validación"
- Podrás revisar y corregir la clasificación

---

## 🐛 Solución de Problemas

### "Error al subir archivo"

→ Verificar que `.env` tiene `OPENAI_API_KEY` o Ollama corriendo
→ Ver logs del backend: `docker logs syntegra-app-backend-1 -f`

### "No aparecen los mensajes"

→ Puede tardar hasta 30 segundos en procesar
→ Verificar en PostgreSQL:

```powershell
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra -c "SELECT COUNT(*) FROM messages;"
```

### "OpenAI error: Invalid API key"

→ Verificar que la clave en `.env` sea correcta
→ Reiniciar backend: `docker compose restart backend`

### "Ollama no responde"

→ Verificar que Ollama esté corriendo:

```bash
ollama list
```

→ Cambiar URL en `.env` a: `http://host.docker.internal:11434/api/generate`

---

## 📈 Próximos Pasos

1. **Subir más datos**: Usa tus CSVs reales de WhatsApp, Instagram, etc.
2. **Validar mensajes**: Corrige clasificaciones erróneas para mejorar precisión
3. **Conectar APIs**: Configura conectores para importación automática
4. **Generar reportes**: Exporta insights para tus clientes

---

## 🎯 Comandos Útiles

```powershell
# Ver logs del backend
docker logs syntegra-app-backend-1 -f

# Reiniciar todo
docker compose restart

# Ver estado de servicios
docker compose ps

# Detener todo
docker compose down

# Ver base de datos
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra

# Query ejemplo:
SELECT client_id, COUNT(*), AVG(CASE WHEN sentiment = 'positive' THEN 1.0 ELSE 0.0 END) as positive_rate
FROM messages
GROUP BY client_id;
```

---

## ✅ Checklist Final

- [ ] `.env` configurado con OpenAI API key o Ollama
- [ ] Backend reiniciado (`docker compose restart backend`)
- [ ] Aplicación abierta en http://localhost:5173
- [ ] Primer cliente creado
- [ ] CSV de prueba subido
- [ ] Mensajes visibles en Data Explorer
- [ ] Dashboard mostrando KPIs reales

**¡Sistema listo para producción con datos reales!** 🎉

---

## 💡 Tip Pro

Para testing rápido sin IA:

```powershell
# Insertar mensaje directo en BD (bypass IA)
docker exec -it syntegra-app-db-1 psql -U syntegra -d syntegra -c "
INSERT INTO messages (id, client_id, text, channel, sentiment, topic, intent)
VALUES ('test_msg', 'client_001', 'Mensaje de prueba', 'whatsapp', 'positive', 'calidad', 'elogio');
"
```
