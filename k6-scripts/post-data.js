import http from 'k6/http';
import { check, sleep } from 'k6';

// Prueba de POST /api/data con JSON
export const options = {
  stages: [
    { duration: '10s', target: 5 },    // Ramp-up: 5 usuarios
    { duration: '30s', target: 20 },   // Ramp-up: 20 usuarios
    { duration: '30s', target: 20 },   // Stay: mantener 20 usuarios
    { duration: '10s', target: 0 },    // Ramp-down: bajar a 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Generar datos únicos para cada solicitud POST
function generateUserData(vu, iteration) {
  return {
    userId: `user_${vu}_${iteration}`,
    name: `Test User ${vu}-${iteration}`,
    email: `user${vu}_${iteration}@example.com`,
  };
}

export default function () {
  const userData = generateUserData(__VU, __ITER);

  // Enviar POST con datos JSON a /api/data
  const res = http.post(
    'http://localhost:3000/api/data',
    JSON.stringify(userData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(res, {
    'POST /api/data - Status is 201': (r) => r.status === 201,
    'POST /api/data - Response time < 500ms': (r) => r.timings.duration < 500,
    'POST /api/data - Has processedData': (r) => r.json('processedData') !== null,
    'POST /api/data - Message is correct': (r) => r.json('message') === 'Data processed successfully',
  });

  sleep(1);
}
