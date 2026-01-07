const express = require('express');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

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
  // Simulamos un retardo aleatorio de hasta 500ms
  const delay = Math.random() * 500;
  
  // Validar que el body tenga propiedades requeridas
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
      processedData: {
        userId,
        name,
        email,
        processedAt: new Date().toISOString()
      },
      delay: `${delay.toFixed(2)}ms`
    });
  }, delay);
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
