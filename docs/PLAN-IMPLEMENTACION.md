# 📋 Plan de Implementación - Laboratorio de Pruebas de Carga y Rendimiento

## 🎯 Objetivo del Laboratorio

Aplicar pruebas de carga y rendimiento a dos niveles de complejidad:

1. **Nivel 1:** API REST sencilla que responde con mensajes básicos
2. **Nivel 2:** Backend completo con autenticación JWT y acceso a MongoDB

---

## ✅ NIVEL 1: API REST Sencilla (COMPLETADO)

### Estado Actual
- ✅ Servidor Express en puerto 3000
- ✅ Endpoints GET/POST básicos
- ✅ Scripts k6 para pruebas
- ✅ Archivo `.gitignore` y `.env.example` configurados

### Scripts Disponibles

| Script | Propósito | Usuarios | Duración |
|--------|-----------|----------|----------|
| `carga-y-rendimiento.js` | Prueba básica con ramp-up/down | 0→100→200→300 | ~2 min |
| `k6-scripts/rps-carga.js` | Control por RPS | Variable (50-300 req/s) | ~2.5 min |
| `k6-scripts/env-carga.js` | Control por variables env | Configurable | Configurable |
| `k6-scripts/post-data.js` | Pruebas POST `/api/data` | 0→20 | ~1.5 min |
| `k6-scripts/concurrente-get-post.js` | GET y POST simultáneos | 0→50 | ~1.5 min |
| `k6-scripts/soak-testing.js` | Prueba de larga duración | 30 constantes | ~30 min |
| `k6-scripts/spike-testing.js` | Pico súbito de usuarios | 5→500→5 | ~2 min |

### Ejecutar Pruebas Nivel 1

```powershell
# Prueba básica
k6 run carga-y-rendimiento.js

# Prueba de POST
k6 run k6-scripts/post-data.js

# Prueba concurrente (GET + POST)
k6 run k6-scripts/concurrente-get-post.js

# Spike testing
k6 run k6-scripts/spike-testing.js

# Con variables de entorno (ej: 100 usuarios)
$env:MODE = 'vus'; $env:VUS = '100'; $env:DURATION = '60s'; k6 run k6-scripts/env-carga.js
```

### Verificar Servidor Nivel 1

```powershell
# Comprobar estado
curl http://localhost:3000/health

# Probar GET
curl http://localhost:3000/api/test

# Probar POST
$body = @{ userId = 'test'; name = 'Test User'; email = 'test@example.com' } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/data" -Method POST -Body $body -ContentType "application/json"
```

---

## 🔐 NIVEL 2: Backend Completo con JWT + MongoDB (A IMPLEMENTAR)

### Fase 1: Instalación de MongoDB

#### Opción A: MongoDB Community Edition Local (Recomendado para desarrollo)

```powershell
# 1. Instalar con Chocolatey (requiere admin)
choco install mongodb-community -y

# 2. Verificar instalación
mongod --version

# 3. Iniciar servicio MongoDB en Windows
# El servicio se instala automáticamente como servicio de Windows
# Verificar en Services (services.msc) o ejecutar:
Get-Service -Name MongoDB | Start-Service

# 4. En otra terminal, verificar conexión
mongosh
# Dentro de mongosh:
> show dbs
> exit
```

#### Opción B: MongoDB Atlas (Cloud - Alternativa)

```
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear cuenta gratuita
3. Crear cluster
4. Obtener connection string
5. Actualizar .env con:
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/k6-testing
```

#### Opción C: Docker (Si tienes Docker instalado)

```powershell
# Descargar imagen MongoDB
docker pull mongo:latest

# Ejecutar contenedor
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Verificar
docker ps
```

### Validación de MongoDB

```powershell
# Conectarse con mongosh
mongosh mongodb://localhost:27017

# Comandos en mongosh
> show dbs
> use k6-testing
> show collections
> exit
```

---

### Fase 2: Crear Backend con JWT + MongoDB

#### Paso 2.1: Instalar Dependencias

```powershell
cd d:\Testing_K6

# Instalar paquetes necesarios
npm install bcryptjs jsonwebtoken mongoose dotenv cors
```

**Paquetes instalados:**
- `bcryptjs` - Encriptación de contraseñas
- `jsonwebtoken` - Generar y verificar JWTs
- `mongoose` - ODM para MongoDB
- `dotenv` - Gestionar variables de entorno
- `cors` - Permitir solicitudes cross-origin

#### Paso 2.2: Actualizar `.env`

Crear archivo `.env` (basado en `.env.example`):

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/k6-testing

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production_12345
JWT_EXPIRATION=1h

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### Paso 2.3: Crear `backend-jwt.js`

```javascript
const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// ==================== CONEXIÓN MONGODB ====================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error conectando MongoDB:', err));

// ==================== ESQUEMA DE USUARIO ====================
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

// ==================== ENDPOINTS DE AUTENTICACIÓN ====================

// POST /auth/register - Registrar nuevo usuario
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Faltan campos requeridos' });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: user._id
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'El email ya existe' });
    }
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

// POST /auth/login - Login de usuario
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: 'Error en login' });
  }
});

// ==================== ENDPOINTS PROTEGIDOS ====================

// GET /api/profile - Obtener perfil del usuario
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener perfil' });
  }
});

// POST /api/update-profile - Actualizar perfil
app.post('/api/update-profile', verifyToken, async (req, res) => {
  const { name } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Perfil actualizado',
      user: user
    });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

// GET /api/data - Obtener datos (requiere autenticación)
app.get('/api/data', verifyToken, (req, res) => {
  res.status(200).json({
    message: 'Datos protegidos obtenidos',
    userId: req.user.userId,
    timestamp: new Date().toISOString()
  });
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor JWT en puerto ${PORT}`);
});
```

---

### Fase 3: Scripts k6 para Backend con JWT

#### Script 3.1: `k6-scripts/backend-auth.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  // Generar email único por iteración
  const email = `user_${__VU}_${__ITER}@example.com`;
  const password = 'TestPassword123!';

  // ==================== REGISTRO ====================
  const registerRes = http.post(
    'http://localhost:3000/auth/register',
    JSON.stringify({ email, password, name: `Test User ${__VU}` }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(registerRes, {
    'Register - Status 201': (r) => r.status === 201,
  });

  sleep(0.5);

  // ==================== LOGIN ====================
  const loginRes = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'Login - Status 200': (r) => r.status === 200,
    'Login - Has token': (r) => r.json('token') !== null,
  });

  // Extraer token
  const token = loginRes.json('token');

  sleep(0.5);

  // ==================== ACCESO A PERFIL (PROTEGIDO) ====================
  const profileRes = http.get(
    'http://localhost:3000/api/profile',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  check(profileRes, {
    'Profile - Status 200': (r) => r.status === 200,
    'Profile - Has email': (r) => r.json('email') !== null,
  });

  sleep(1);
}
```

#### Script 3.2: `k6-scripts/jwt-performance.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

// Prueba enfocada en rendimiento de autenticación
export const options = {
  stages: [
    { duration: '5s', target: 20 },
    { duration: '20s', target: 100 },
    { duration: '20s', target: 100 },
    { duration: '5s', target: 0 },
  ],
};

export default function () {
  const email = `perfuser_${__VU}_${__ITER}@example.com`;
  const password = 'TestPassword123!';

  // Registro
  http.post(
    'http://localhost:3000/auth/register',
    JSON.stringify({ email, password, name: 'Perf User' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  sleep(0.2);

  // Login - Medir tiempo de autenticación
  const loginRes = http.post(
    'http://localhost:3000/auth/login',
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'Auth time < 500ms': (r) => r.timings.duration < 500,
  });

  const token = loginRes.json('token');

  // Acceso a datos protegidos
  http.get(
    'http://localhost:3000/api/data',
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  sleep(0.5);
}
```

---

### Fase 4: Pruebas y Análisis

#### Ejecutar Backend con JWT

```powershell
# Asegurarse de que MongoDB está corriendo
Get-Service -Name MongoDB | Start-Service

# Ejecutar backend
node backend-jwt.js
```

#### Ejecutar Pruebas k6

```powershell
# Prueba de autenticación completa
k6 run k6-scripts/backend-auth.js

# Prueba de rendimiento de JWT
k6 run k6-scripts/jwt-performance.js
```

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### Requisitos del Sistema

| Componente | Requerimiento | Verificar |
|------------|---------------|----------|
| **Node.js** | v14+ | `node --version` |
| **npm** | v6+ | `npm --version` |
| **MongoDB** | Community/Atlas | `mongod --version` |
| **k6** | v0.40+ | `k6 --version` |
| **RAM** | 4GB+ | Para pruebas con 300+ VUs |
| **CPU** | 2+ cores | Para ejecutar servidor + k6 |
| **Conexión** | Localhost | Para MongoDB local |

### Límites Conocidos

1. **Límite de conexiones MongoDB**
   - Local: ~1000 conexiones simultáneas
   - Atlas: Depende del plan
   - Solución: Reutilizar conexiones, usar connection pooling

2. **Límite de procesos por usuario (Windows)**
   - Default: ~512 handles por proceso
   - k6 con 500+ VUs necesita ajustes
   - Solución: Ejecutar desde Admin, aumentar límites

3. **Rendimiento del servidor local**
   - 100 VUs: ✅ Sin problemas
   - 300 VUs: ⚠️ Puede saturarse
   - 500+ VUs: ❌ Requiere infraestructura más potente

### Potenciales Problemas

#### Problema: "Port 3000 already in use"
```powershell
# Encontrar proceso en puerto 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess

# Matar proceso
Stop-Process -Id <PID> -Force
```

#### Problema: "MongoDB connection refused"
```powershell
# Verificar si MongoDB está corriendo
Get-Service -Name MongoDB

# Iniciar servicio
Start-Service -Name MongoDB

# Verificar conexión
mongosh mongodb://localhost:27017
```

#### Problema: "ECONNREFUSED en k6"
- Verificar que el servidor Express está corriendo
- Verificar que MongoDB está conectado
- Comprobar que no hay firewall bloqueando puertos

#### Problema: "Too many open files"
- Aumentar límite de file descriptors
- Reducir número de VUs
- Usar connection pooling en MongoDB

### Mejores Prácticas

1. **Autenticación JWT**
   - Cambiar `JWT_SECRET` en producción
   - Usar HTTPS en producción
   - Implementar refresh tokens

2. **MongoDB**
   - Crear índices en campos frecuentes
   - Usar replica sets para alta disponibilidad
   - Implementar backups regulares

3. **Pruebas k6**
   - Reutilizar tokens entre iteraciones (evitar re-autenticación)
   - Usar connection pooling
   - Monitorear logs del servidor durante pruebas

4. **Seguridad**
   - Validar inputs en todos los endpoints
   - Implementar rate limiting
   - Usar HTTPS en producción
   - Auditar accesos

---

## 📊 COMPARACIÓN ESPERADA: Nivel 1 vs Nivel 2

| Métrica | Nivel 1 (Simple) | Nivel 2 (JWT + BD) | Diferencia |
|---------|-----------------|-------------------|-----------|
| Latencia P50 | ~50ms | ~150ms | +200% |
| Latencia P95 | ~150ms | ~400ms | +166% |
| Latencia P99 | ~250ms | ~800ms | +220% |
| Max throughput | ~2000 req/s | ~500 req/s | -75% |
| Tasa de error (100 VUs) | <1% | <5% | Variable |
| CPU promedio | ~30% | ~60% | +100% |
| Memoria promedio | ~100MB | ~300MB | +200% |

**Razones de la diferencia:**
- Encriptación de contraseñas (bcrypt)
- Generación/verificación de tokens JWT
- Acceso a base de datos
- Mayor cantidad de lógica de negocio

---

## 🎯 MÉTRICAS A REGISTRAR

### Por cada prueba, documentar:

```
Fecha: [fecha]
Tipo de prueba: [soak/spike/concurrente]
Nivel: [1 o 2]
Configuración: [VUs, duración, stages]

Resultados:
- Requests completados: [N]
- Requests fallidos: [N]
- Latencia P50: [ms]
- Latencia P95: [ms]
- Latencia P99: [ms]
- Throughput promedio: [req/s]
- Throughput máximo: [req/s]
- Checks fallidos: [N]
- Thresholds cruzados: [Sí/No]
- Errores observados: [lista]

Notas:
[observaciones del desarrollador]
```

---

## 📚 RECURSOS ADICIONALES

- [Documentación k6](https://k6.io/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT.io](https://jwt.io/)
- [Express.js Guide](https://expressjs.com/)

---

## 🔄 PRÓXIMOS PASOS

1. ✅ Nivel 1 completado
2. ⏳ Instalar MongoDB
3. ⏳ Crear backend JWT
4. ⏳ Scripts k6 autenticados
5. ⏳ Ejecutar y analizar
6. ⏳ Documentar resultados

**¿Comenzamos con Fase 1?** 🚀
