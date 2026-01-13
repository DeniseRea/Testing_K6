import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga
export const options = {
  stages: [
    { duration: '10s', target: 100 },   // Ramp-up: aumentar a 5 usuarios en 10s
    { duration: '20s', target: 150 },  // Ramp-up: aumentar a 10 usuarios en 20s
    { duration: '30s', target: 200 },  // Stay: mantener 10 usuarios por 30s
    { duration: '40s', target: 300 },  // Ramp-down: bajar a 5 usuarios en 20s
    { duration: '10s', target: 0 },   // Ramp-down: bajar a 0 usuarios en 10s
  ],
  thresholds: {
    // El 95% de las solicitudes deben completarse en menos de 500ms, el 99% en menos de 1s
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    // Menos del 10% de las solicitudes pueden fallar
    'http_req_failed': ['rate<0.1'],
  },
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
