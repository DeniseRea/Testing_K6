import http from 'k6/http';
import { check, sleep } from 'k6';

// SOAK TESTING: Larga duración con carga moderada constante
// Objetivo: detectar memory leaks, conexiones no cerradas, degradación de rendimiento
export const options = {
  stages: [
    { duration: '5m', target: 30 },     // Ramp-up: 30 usuarios en 5 minutos
    { duration: '20m', target: 30 },    // Stay: mantener 30 usuarios por 20 minutos
    { duration: '5m', target: 0 },      // Ramp-down: bajar a 0 en 5 minutos
  ],
  thresholds: {
    // En soak testing, permitimos más holgura que en pruebas normales
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  const userData = {
    userId: `soak_user_${__VU}`,
    name: `Soak Test User ${__VU}`,
    email: `soak${__VU}@example.com`,
  };

  // GET request
  const resGet = http.get('http://localhost:3000/api/test');
  check(resGet, {
    'GET - Status 200': (r) => r.status === 200,
  });

  sleep(1);

  // POST request
  const resPost = http.post(
    'http://localhost:3000/api/data',
    JSON.stringify(userData),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(resPost, {
    'POST - Status 201': (r) => r.status === 201,
  });

  // Esperar más tiempo para simular comportamiento realista
  sleep(2);
}
