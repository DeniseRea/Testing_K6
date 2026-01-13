# Testing K6 - Pruebas de Carga y Rendimiento

Proyecto de pruebas de carga y rendimiento utilizando k6, Node.js, Express, MongoDB y JWT.

## 📋 Descripción

Este repositorio contiene la implementación completa del Laboratorio N°5 de Pruebas de Software, donde se aplican diferentes tipos de pruebas de rendimiento a APIs REST.

**Integrantes:**
- Mesias Orlando Mariscal Oña
- Denise Noemi Rea Diaz
- Julio Enrique Viche Castillo

## 🚀 Estructura del Proyecto

```
Testing_K6/
├── server.js                    # API REST básica
├── backend-jwt.js              # Backend completo con JWT y MongoDB
├── package.json                # Dependencias del proyecto
├── .env                        # Variables de entorno (no incluido en repo)
├── .env.example               # Ejemplo de variables de entorno
├── docs/                       # Documentación
│   ├── GUIA-EVIDENCIAS.md     # Guía para capturas de pantalla
│   ├── PLAN-IMPLEMENTACION.md # Plan de implementación
│   └── informe.tex            # Plantilla de informe LaTeX
├── k6-scripts/                 # Scripts de pruebas k6
│   ├── carga-y-rendimiento.js # Prueba básica de carga
│   ├── backend-auth.js        # Pruebas de autenticación
│   ├── backend-completo.js    # Pruebas completas del backend
│   ├── concurrente-get-post.js # Pruebas concurrentes
│   ├── env-carga.js           # Pruebas con variables de entorno
│   ├── jwt-performance.js     # Rendimiento de JWT
│   ├── post-data.js           # Pruebas de POST
│   ├── rps-carga.js           # Pruebas de RPS (Requests Per Second)
│   ├── soak-testing.js        # Pruebas de larga duración
│   └── spike-testing.js       # Pruebas de picos súbitos
├── results/                    # Resultados de pruebas
└── images/                     # Imágenes y capturas de pantalla

```

## 🛠️ Tecnologías Utilizadas

- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **MongoDB Atlas**: Base de datos NoSQL
- **JWT**: Autenticación con tokens
- **bcryptjs**: Encriptación de contraseñas
- **k6**: Herramienta de pruebas de carga
- **dotenv**: Gestión de variables de entorno
- **CORS**: Cross-Origin Resource Sharing

## 📦 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/DeniseRea/Testing_K6.git
cd Testing_K6
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` basado en `.env.example`:

```env
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/k6testing
JWT_SECRET=tu_secreto_super_seguro
JWT_EXPIRATION=1h
PORT=3000
CORS_ORIGIN=*
```

### 4. Instalar k6

**Windows (con Chocolatey):**
```powershell
choco install k6
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install k6
```

**Docker:**
```bash
docker pull grafana/k6
```

## 🚀 Uso

### Iniciar Servidores

**API REST básica:**
```bash
npm start
# o
node server.js
```

**Backend completo con JWT:**
```bash
npm run start:jwt
# o
node backend-jwt.js
```

### Ejecutar Pruebas k6

**Prueba básica de carga:**
```bash
npm run k6:basic
# o
k6 run k6-scripts/carga-y-rendimiento.js
```

**Pruebas de autenticación:**
```bash
npm run k6:auth
```

**Pruebas de rendimiento JWT:**
```bash
npm run k6:jwt-perf
```

**Spike Testing:**
```bash
npm run k6:spike
```

**Soak Testing:**
```bash
npm run k6:soak
```

## 📊 Tipos de Pruebas Implementadas

### 1. Pruebas de Carga Básica
- Aumento gradual de usuarios virtuales
- Evaluación de tiempo de respuesta
- Detección de degradación de rendimiento

### 2. Pruebas de Autenticación
- Registro de usuarios
- Login y generación de JWT
- Acceso a rutas protegidas

### 3. Pruebas Concurrentes
- Solicitudes GET y POST simultáneas
- Evaluación de manejo de múltiples operaciones

### 4. Spike Testing
- Picos súbitos de carga (5 → 500 usuarios)
- Evaluación de resiliencia del sistema

### 5. Soak Testing
- Carga moderada durante largos períodos (20+ minutos)
- Detección de memory leaks
- Evaluación de estabilidad

### 6. RPS Testing
- Pruebas basadas en requests por segundo
- Evaluación de throughput máximo

## 📈 Métricas Evaluadas

- **http_req_duration**: Latencia de solicitudes
- **http_req_failed**: Tasa de errores
- **http_reqs**: Total de solicitudes
- **vus**: Usuarios virtuales simulados
- **iteration_duration**: Tiempo por iteración
- **data_received/sent**: Datos transferidos

## 🔧 Scripts NPM Disponibles

```json
{
  "start": "node server.js",
  "start:jwt": "node backend-jwt.js",
  "k6:basic": "k6 run k6-scripts/carga-y-rendimiento.js",
  "k6:auth": "k6 run k6-scripts/backend-auth.js",
  "k6:jwt-perf": "k6 run k6-scripts/jwt-performance.js",
  "k6:spike": "k6 run k6-scripts/spike-testing.js",
  "k6:soak": "k6 run k6-scripts/soak-testing.js"
}
```

## 📝 Endpoints API

### API REST Básica (server.js - Puerto 3000)

- `GET /` - Información de la API
- `GET /health` - Health check
- `GET /api/test` - Respuesta simple con retardo aleatorio
- `POST /api/test` - Recibir y responder datos
- `POST /api/data` - Procesar datos con validación

### Backend JWT (backend-jwt.js - Puerto 3000)

**Autenticación:**
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login y obtener token

**Rutas protegidas (requieren token JWT):**
- `GET /api/profile` - Obtener perfil del usuario
- `POST /api/update-profile` - Actualizar perfil
- `GET /api/data` - Obtener datos protegidos

**Públicas:**
- `GET /` - Información de la API
- `GET /health` - Health check

## 📚 Documentación Adicional

- [GUIA-EVIDENCIAS.md](docs/GUIA-EVIDENCIAS.md) - Guía completa para obtener evidencias fotográficas
- [PLAN-IMPLEMENTACION.md](docs/PLAN-IMPLEMENTACION.md) - Plan de implementación del proyecto

## 🤝 Contribuciones

Este proyecto es parte de un laboratorio académico. Las contribuciones están limitadas a los integrantes del equipo.

## 📄 Licencia

ISC

## 👥 Contacto

**Docente:** Ing. Enrique Calvopiña, Mgtr.  
**Asignatura:** Pruebas de Software  
**Institución:** ESPE - Sede Santo Domingo  
**Período:** 2025-50