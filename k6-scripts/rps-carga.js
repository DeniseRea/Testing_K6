import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración enfocada en RPS (Requests Per Second)
export const options = {
  scenarios: {
    rps_scenario: {
      executor: 'ramping-arrival-rate',
      startRate: 10,          // req/s inicial
      timeUnit: '1s',
      preAllocatedVUs: 200,   // VUs pre-asignados
      maxVUs: 1000,           // VUs máximos permitidos
      stages: [
        { target: 50, duration: '30s' },    // Ramp-up: subir a 50 req/s en 30s
        { target: 150, duration: '1m' },    // Ramp-up: subir a 150 req/s en 1m
        { target: 300, duration: '1m' },    // Ramp-up: subir a 300 req/s en 1m
        { target: 0, duration: '30s' },     // Ramp-down: bajar a 0 en 30s
      ],
    },
  },
  thresholds: {
    // El 95% de las solicitudes deben completarse en menos de 500ms
    'http_req_duration': ['p(95)<500'],
    // El 99% de las solicitudes deben completarse en menos de 1000ms
    'http_req_duration': ['p(99)<1000'],
    // Menos del 10% de las solicitudes pueden fallar
    'http_req_failed': ['rate<0.1'],
    // La tasa de éxito debe ser mayor al 90%
    'http_reqs': ['rate>0.9'],
  },
};

// Función principal que se ejecuta por cada solicitud HTTP
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
