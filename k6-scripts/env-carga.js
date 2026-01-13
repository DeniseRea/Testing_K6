import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración dinámmica: se puede cambiar con variables de entorno
// Uso: MODE=vus VUS=150 DURATION=60s k6 run k6-scripts/env-carga.js
export const options = (() => {
  // Si se pasa MODE=vus, usar VUs constantes
  if (__ENV.MODE === 'vus') {
    return {
      vus: Number(__ENV.VUS || 100),
      duration: __ENV.DURATION || '60s',
    };
  }

  // Modo por defecto: stages (ramp-up / stay / ramp-down)
  return {
    stages: [
      { duration: '10s', target: 100 },   // Ramp-up: 0 -> 100 usuarios en 10s
      { duration: '20s', target: 150 },   // Ramp-up: 100 -> 150 usuarios en 20s
      { duration: '30s', target: 200 },   // Ramp-up: 150 -> 200 usuarios en 30s
      { duration: '40s', target: 300 },   // Ramp-up: 200 -> 300 usuarios en 40s
      { duration: '30s', target: 300 },   // Stay: mantener 300 usuarios por 30s
      { duration: '10s', target: 0 },     // Ramp-down: 300 -> 0 usuarios en 10s
    ],
  };
})();

// Thresholds (umbrales de rendimiento)
export const thresholds = {
  'http_req_duration': ['p(95)<500', 'p(99)<1000'],
  'http_req_failed': ['rate<0.1'],
};

// Función principal que se ejecuta por cada usuario virtual
export default function () {
  // Solicitud HTTP GET al endpoint de prueba
  const res = http.get('http://localhost:3000/api/test');

  // Validar la respuesta usando "check"
  check(res, {
    'Status is 200': (r) => r.status === 200,
    'Response time < 500ms': (r) => r.timings.duration < 500,
    'Has message property': (r) => r.json('message') !== null,
    'Has timestamp property': (r) => r.json('timestamp') !== null,
  });

  // Esperar 1 segundo antes de la siguiente solicitud
  sleep(1);
}
