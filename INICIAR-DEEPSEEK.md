# 🚀 Configuración con DeepSeek R1 14B

## 1. Descargar el modelo (solo primera vez)

```powershell
ollama pull deepseek-r1:14b
```

**Nota:** El modelo pesa ~8GB, puede tardar 10-30 minutos dependiendo de tu internet.

## 2. Verificar que está descargado

```powershell
ollama list
```

Deberías ver:

```
NAME                ID              SIZE    MODIFIED
deepseek-r1:14b    abc123def456    8.1 GB  X minutes ago
```

## 3. Probar el modelo

```powershell
ollama run deepseek-r1:14b "Clasifica este mensaje como positivo o negativo: El servicio es excelente"
```

Debería responder algo como:

```
<think>
Analizando el mensaje...
</think>

Clasificación: Positivo
El mensaje expresa satisfacción con el servicio.
```

## 4. Reiniciar el backend

```powershell
docker compose restart backend
```

## 5. Ver logs para confirmar

```powershell
docker logs syntegra-app-backend-1 -f
```

Deberías ver:

```
🤖 Usando Ollama: deepseek-r1:14b en http://host.docker.internal:11434/api/generate
```

## 6. Probar subiendo un CSV

Crear archivo `test.csv`:

```csv
text,timestamp
El producto llegó rápido y en perfecto estado,2025-01-05T10:00:00Z
Muy mal servicio, nadie me responde,2025-01-05T11:00:00Z
¿Cuánto cuesta el envío?,2025-01-05T12:00:00Z
```

Subirlo en la aplicación y esperar ~2-5 minutos (DeepSeek es más lento pero más preciso).

---

## ⚡ Notas sobre DeepSeek R1 14B

**Ventajas:**

- ✅ Gratis y local (privacidad total)
- ✅ Muy buena precisión en clasificación
- ✅ Razonamiento explícito (piensa antes de responder)

**Consideraciones:**

- ⏱️ Más lento que llama3.2 (~5-10 segundos por mensaje)
- 💾 Requiere ~10GB RAM
- 🖥️ Mejor con GPU NVIDIA (CUDA)

**Recomendaciones:**

- Para lotes grandes (>100 mensajes), dejar procesando y hacer otra cosa
- El modelo "piensa" antes de responder, es normal que tarde
- Si es muy lento, considera cambiar a `deepseek-r1:1.5b` (más rápido, menos preciso)

---

## 🐛 Solución de Problemas

### "Model not found"

```powershell
ollama pull deepseek-r1:14b
```

### "Out of memory"

Cambiar a versión más pequeña:

```powershell
ollama pull deepseek-r1:1.5b
```

Y en `.env` cambiar a: `OLLAMA_MODEL=deepseek-r1:1.5b`

### Muy lento

- Verificar que Ollama use GPU: `ollama ps` debería mostrar uso de GPU
- Si no tienes GPU, considera usar modelo más pequeño
- O usar OpenAI (más rápido pero de pago)

---

**Sistema configurado para DeepSeek R1 14B** 🎯
