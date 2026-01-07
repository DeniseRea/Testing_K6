const express = require('express');
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// ==================== CONEXIÓN MONGODB ATLAS ====================
console.log('🔄 Conectando a MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB Atlas conectado exitosamente'))
  .catch(err => console.error('❌ Error conectando MongoDB:', err.message));

// ==================== ESQUEMA DE USUARIO ====================
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Crear índice para email
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Token requerido',
      error: 'No authorization header'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ 
      message: 'Token inválido o expirado',
      error: err.message
    });
  }
};

// ==================== RUTA RAÍZ ====================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to K6 Testing Backend with JWT + MongoDB Atlas',
    version: '2.0.0',
    endpoints: {
      auth: {
        'POST /auth/register': 'Registrar nuevo usuario',
        'POST /auth/login': 'Login y obtener token JWT'
      },
      protected: {
        'GET /api/profile': 'Obtener perfil del usuario (requiere token)',
        'POST /api/update-profile': 'Actualizar perfil (requiere token)',
        'GET /api/data': 'Obtener datos protegidos (requiere token)'
      },
      health: {
        'GET /health': 'Health check del servidor'
      }
    }
  });
});

// ==================== ENDPOINTS DE AUTENTICACIÓN ====================

// POST /auth/register - Registrar nuevo usuario
app.post('/auth/register', async (req, res) => {
  const startTime = Date.now();
  const { email, password, name } = req.body;

  // Validación de campos
  if (!email || !password || !name) {
    return res.status(400).json({ 
      message: 'Faltan campos requeridos',
      required: ['email', 'password', 'name'],
      responseTime: `${Date.now() - startTime}ms`
    });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'El email ya está registrado',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Crear nuevo usuario
    const user = new User({ 
      email: email.toLowerCase(), 
      password: hashedPassword, 
      name 
    });
    
    await user.save();

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      userId: user._id,
      email: user.email,
      responseTime: `${Date.now() - startTime}ms`
    });
  } catch (err) {
    console.error('Error en registro:', err);
    res.status(500).json({ 
      message: 'Error al registrar usuario',
      error: err.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// POST /auth/login - Login de usuario
app.post('/auth/login', async (req, res) => {
  const startTime = Date.now();
  const { email, password } = req.body;

  // Validación de campos
  if (!email || !password) {
    return res.status(400).json({ 
      message: 'Email y contraseña requeridos',
      responseTime: `${Date.now() - startTime}ms`
    });
  }

  try {
    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        message: 'Credenciales inválidas',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '1h' }
    );

    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      userId: user._id,
      email: user.email,
      expiresIn: process.env.JWT_EXPIRATION,
      responseTime: `${Date.now() - startTime}ms`
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ 
      message: 'Error en login',
      error: err.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// ==================== ENDPOINTS PROTEGIDOS ====================

// GET /api/profile - Obtener perfil del usuario
app.get('/api/profile', verifyToken, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado',
        responseTime: `${Date.now() - startTime}ms`
      });
    }

    res.status(200).json({
      user: user,
      responseTime: `${Date.now() - startTime}ms`
    });
  } catch (err) {
    console.error('Error en profile:', err);
    res.status(500).json({ 
      message: 'Error al obtener perfil',
      error: err.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// POST /api/update-profile - Actualizar perfil
app.post('/api/update-profile', verifyToken, async (req, res) => {
  const startTime = Date.now();
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ 
      message: 'El nombre es requerido',
      responseTime: `${Date.now() - startTime}ms`
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: user,
      responseTime: `${Date.now() - startTime}ms`
    });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ 
      message: 'Error al actualizar perfil',
      error: err.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

// GET /api/data - Obtener datos protegidos
app.get('/api/data', verifyToken, (req, res) => {
  const startTime = Date.now();
  
  res.status(200).json({
    message: 'Datos protegidos obtenidos exitosamente',
    userId: req.user.userId,
    email: req.user.email,
    timestamp: new Date().toISOString(),
    data: {
      sampleData: 'Este endpoint está protegido por JWT',
      accessLevel: 'authenticated'
    },
    responseTime: `${Date.now() - startTime}ms`
  });
});

// ==================== ENDPOINTS PÚBLICOS ====================

// GET /health - Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor JWT + MongoDB Atlas iniciado`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔗 API Docs: http://localhost:${PORT}/\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Apagando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});
