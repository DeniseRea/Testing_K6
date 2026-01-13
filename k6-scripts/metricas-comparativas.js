import http from 'k6/http';
import { check, sleep } from 'k6';

// Leer el número de VUs desde variable de entorno (__ENV.VUS)
const VUS = parseInt(__ENV.VUS || '100');
const DURATION = __ENV.DURATION || '30s';

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.1'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/test');

  check(res, {
    'Status is 200': (r) => r.status === 200,
    'Response time < 500ms': (r) => r.timings.duration < 500,
    'Has message property': (r) => r.json('message') !== null,
    'Has timestamp property': (r) => r.json('timestamp') !== null,
  });

  sleep(1);
}
