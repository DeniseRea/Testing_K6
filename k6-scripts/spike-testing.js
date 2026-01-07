import http from 'k6/http';
import { check, sleep } from 'k6';

// SPIKE TESTING: Pico súbito de usuarios
// Objetivo: detectar cómo el sistema maneja aumentos inesperados y masivos de carga
export const options = {
  stages: [
    { duration: '10s', target: 5 },      // Carga base: 5 usuarios
    { duration: '30s', target: 5 },      // Mantener carga base
    { duration: '5s', target: 500 },     // PICO: salto súbito a 500 usuarios en 5 segundos
    { duration: '30s', target: 500 },    // Mantener el pico
    { duration: '5s', target: 5 },       // Bajar rápidamente a carga base
    { duration: '10s', target: 0 },      // Terminar
  ],
  thresholds: {
    // Thresholds más permisivos durante el spike (el sistema puede saturarse)
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.2'], // Permitir hasta 20% de fallos durante spike
  },
};

export default function () {
  const userData = {
    userId: `spike_user_${__VU}`,
    name: `Spike Test User ${__VU}`,
    email: `spike${__VU}@example.com`,
  };

  // GET request
  const resGet = http.get('http://localhost:3000/api/test');
  
  check(resGet, {
    'GET - Status 200': (r) => r.status === 200,
    'GET - Response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);

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
    'POST - Response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}
