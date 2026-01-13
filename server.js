const express = require('express');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Soporte para forms (x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Logging después de parsear el body
app.use((req, res, next) => {
  console.log('--- Incoming request ---');
  console.log('Method:', req.method, 'URL:', req.originalUrl);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body:', req.body);
  next();
});

// Ruta raíz - Información de la API
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the K6 Testing API',
    version: '1.0.0',
    endpoints: {
      GET: {
        '/health': 'Verifica el estado del servidor',
        '/api/test': 'Retorna una respuesta simple con retardo aleatorio (0-500ms)'
      },
      POST: {
        '/api/test': 'Recibe datos JSON y responde con los datos recibidos'
      }
    },
    examples: {
      GET: 'curl http://localhost:3000/api/test',
      POST: 'curl -X POST http://localhost:3000/api/test -H "Content-Type: application/json" -d \'{"name":"test"}\''
    }
  });
});

// Ruta GET - Respuesta simple con retardo aleatorio
app.get('/api/test', (req, res) => {
  // Simulamos un retardo aleatorio de hasta 500ms
  const delay = Math.random() * 500;

  setTimeout(() => {
    res.status(200).json({
      message: 'GET request successful',
      timestamp: new Date().toISOString(),
      delay: `${delay.toFixed(2)}ms`
    });
  }, delay);
});

// Ruta POST - Recibir datos y responder con lo recibido
app.post('/api/test', (req, res) => {
  // Simulamos un retardo aleatorio de hasta 500ms
  const delay = Math.random() * 500;

  setTimeout(() => {
    res.status(201).json({
      message: 'POST request successful',
      timestamp: new Date().toISOString(),
      receivedData: req.body,
      delay: `${delay.toFixed(2)}ms`
    });
  }, delay);
});

// Ruta POST /api/data - Para procesar datos con validación
app.post('/api/data', (req, res) => {
  try {
    const delay = Math.random() * 500;

    // Valida que sí se haya recibido un body JSON
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Request body is missing or invalid. Set header Content-Type: application/json and send a JSON body.'
      });
    }

    const { userId, name, email } = req.body;

    if (!userId || !name || !email) {
      return res.status(400).json({
        message: 'Missing required fields',
        requiredFields: ['userId', 'name', 'email']
      });
    }

    setTimeout(() => {
      res.status(201).json({
        message: 'Data processed successfully',
        timestamp: new Date().toISOString(),
        processedData: { userId, name, email, processedAt: new Date().toISOString() },
        delay: `${delay.toFixed(2)}ms`
      });
    }, delay);

  } catch (err) {
    console.error('Unexpected error in /api/data:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Alias para /api/health
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// GET para /api/data - Muestra información de uso
app.get('/api/data', (req, res) => {
  res.status(200).json({
    message: 'This endpoint requires a POST request with JSON body',
    method: 'POST',
    requiredFields: ['userId', 'name', 'email'],
    example: {
      userId: '123',
      name: 'John Doe',
      email: 'john@example.com'
    }
  });
});

// Ruta POST - Debugging de cuerpo crudo
app.post('/raw-debug', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  const raw = req.body ? req.body.toString() : '';
  console.log('raw-debug headers:', req.headers);
  console.log('raw-debug length:', raw.length);
  console.log('raw-debug body:', raw);
  res.json({ length: raw.length, raw, headers: req.headers });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
