import http from 'k6/http';
import { check, sleep } from 'k6';

// Prueba concurrente de GET y POST
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp-up: 10 usuarios
    { duration: '30s', target: 50 },   // Ramp-up: 50 usuarios
    { duration: '40s', target: 50 },   // Stay: mantener 50 usuarios
    { duration: '10s', target: 0 },    // Ramp-down: bajar a 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.05'],
  },
};

export default function () {
  // Generar datos para POST
  const userData = {
    userId: `user_${__VU}_${__ITER}`,
    name: `Concurrent User ${__VU}-${__ITER}`,
    email: `concurrent${__VU}_${__ITER}@example.com`,
  };

  // ==================== SOLICITUD GET ====================
  const resGet = http.get('http://localhost:3000/api/test');

  check(resGet, {
    'GET /api/test - Status is 200': (r) => r.status === 200,
    'GET /api/test - Response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.3);

  // ==================== SOLICITUD POST ====================
  const resPost = http.post(
    'http://localhost:3000/api/data',
    JSON.stringify(userData),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  check(resPost, {
    'POST /api/data - Status is 201': (r) => r.status === 201,
    'POST /api/data - Response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.3);

  // ==================== SEGUNDO GET ====================
  const resGet2 = http.get('http://localhost:3000/health');

  check(resGet2, {
    'GET /health - Status is 200': (r) => r.status === 200,
  });

  sleep(0.4);
}
