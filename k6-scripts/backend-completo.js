import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga del backend completo
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp-up: 0 -> 10 usuarios en 10s
    { duration: '20s', target: 50 },   // Ramp-up: 10 -> 50 usuarios en 20s
    { duration: '30s', target: 100 },  // Ramp-up: 50 -> 100 usuarios en 30s
    { duration: '60s', target: 100 },  // Stay: mantener 100 usuarios por 60s
    { duration: '20s', target: 0 },    // Ramp-down: 100 -> 0 usuarios en 20s
  ],
  thresholds: {
    // El 95% de las solicitudes deben completarse en menos de 500ms
    'http_req_duration': ['p(95)<500'],
    // El 99% de las solicitudes deben completarse en menos de 1000ms
    'http_req_duration': ['p(99)<1000'],
    // Menos del 5% de las solicitudes pueden fallar
    'http_req_failed': ['rate<0.05'],
    // El 95% de las solicitudes deben ser exitosas
    'http_reqs': ['rate>0.95'],
  },
};

// Función que genera datos únicos basados en VU e iteración
function generateUniqueData(vu, iteration) {
  return {
    userId: `user_${vu}`,
    iterationNumber: iteration,
    timestamp: new Date().toISOString(),
    data: `Solicitud desde VU#${vu} - Iteración #${iteration}`,
    randomValue: Math.random() * 1000,
  };
}

// Función principal que se ejecuta por cada usuario virtual en cada iteración
export default function () {
  // Datos únicos para esta iteración
  const uniqueData = generateUniqueData(__VU, __ITER);

  // ==================== PRUEBA 1: GET /api/test ====================
  const resGet = http.get('http://localhost:3000/api/test');

  check(resGet, {
    'GET /api/test - Status is 200': (r) => r.status === 200,
    'GET /api/test - Response time < 500ms': (r) => r.timings.duration < 500,
    'GET /api/test - Has message property': (r) => r.json('message') !== null,
    'GET /api/test - Has timestamp property': (r) => r.json('timestamp') !== null,
  });

  // Esperar 0.5 segundos
  sleep(0.5);

  // ==================== PRUEBA 2: POST /api/test ====================
  const resPost = http.post(
    'http://localhost:3000/api/test',
    JSON.stringify(uniqueData),
    {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `K6-Test/VU-${__VU}-ITER-${__ITER}`,
      },
    }
  );

  check(resPost, {
    'POST /api/test - Status is 201': (r) => r.status === 201,
    'POST /api/test - Response time < 500ms': (r) => r.timings.duration < 500,
    'POST /api/test - Has message property': (r) => r.json('message') !== null,
    'POST /api/test - Has receivedData property': (r) => r.json('receivedData') !== null,
  });

  // Esperar 0.5 segundos
  sleep(0.5);
}
