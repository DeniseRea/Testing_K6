const express = require('express');

const app = express();
const PORT = 3000;

// Middleware para parsear JSON
app.use(express.json());

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

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
