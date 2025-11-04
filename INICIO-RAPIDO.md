# 🚀 Guía de Inicio Rápido - Syntegra

## Paso 1: Verificar Docker Desktop

**IMPORTANTE:** Docker Desktop debe estar ejecutándose antes de continuar.

### Windows:

1. Buscar "Docker Desktop" en el menú inicio
2. Hacer clic para abrir
3. Esperar a que aparezca el ícono de Docker en la bandeja del sistema (esquina inferior derecha)
4. El ícono debe estar verde/blanco (no rojo)

### Verificar que Docker está corriendo:

```powershell
docker --version
```

Si ves un error, Docker Desktop no está corriendo.

---

## Paso 2: Iniciar Syntegra

Abrir PowerShell o CMD en la carpeta del proyecto:

```powershell
cd c:\Users\danie\Escritorio\Syntegra-App
docker compose up --build
```

**Tiempo de espera:** Primera vez ~5-10 minutos (descarga imágenes)

---

## Paso 3: Acceder a la aplicación

Una vez que veas estos mensajes:

```
✅ backend-1   | 🚀 Backend running on port 4000
✅ frontend-1  | VITE ready in XXXms
✅ worker-1    | 🔧 Worker started successfully
```

**Abre tu navegador:**

- 🎨 **Frontend:** http://localhost:5173
- 📊 **API:** http://localhost:4000/api/insights
- 💚 **Health:** http://localhost:4000/health

---

## Paso 4: Detener la aplicación

Para detener (mantener PowerShell abierto):

```
Ctrl + C
```

Para detener y limpiar:

```powershell
docker compose down
```

---

## ⚠️ Solución de Problemas

### Error: "open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified"

**Solución:**

1. Abrir Docker Desktop
2. Esperar 30 segundos
3. Volver a ejecutar `docker compose up --build`

### Error: "port is already allocated"

**Solución:**

```powershell
# Ver qué está usando el puerto 4000
netstat -ano | findstr :4000

# Matar el proceso (reemplazar <PID> con el número que aparece)
taskkill /PID <PID> /F

# Lo mismo para el puerto 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Error: "Cannot connect to backend"

**Solución:**

```powershell
# Reiniciar todo
docker compose down
docker compose up --build
```

### Limpiar completamente y empezar de cero

```powershell
docker compose down -v
docker system prune -a --volumes
docker compose up --build
```

---

## 📝 Comandos útiles

```powershell
# Ver logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs worker

# Ver logs en tiempo real
docker compose logs -f

# Reiniciar un servicio específico
docker compose restart backend

# Ver contenedores corriendo
docker ps

# Entrar a un contenedor
docker exec -it syntegra-app-backend-1 sh
```

---

## ✅ Checklist de inicio

- [ ] Docker Desktop está abierto y ejecutándose (ícono verde)
- [ ] Puerto 4000 está libre
- [ ] Puerto 5173 está libre
- [ ] Abrir PowerShell en `c:\Users\danie\Escritorio\Syntegra-App`
- [ ] Ejecutar `docker compose up --build`
- [ ] Esperar mensajes de éxito
- [ ] Abrir http://localhost:5173

---

## 🎯 Desarrollo local (alternativa sin Docker)

Si Docker da problemas, puedes ejecutar localmente:

### Backend

```powershell
cd backend
npm install
npm run dev
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

### Worker

```powershell
cd worker
npm install
npm start
```

**Nota:** Necesitas Node.js 18+ instalado.
