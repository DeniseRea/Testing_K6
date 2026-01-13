import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Métricas personalizadas
const registerSuccess = new Counter('register_success');
const loginSuccess = new Counter('login_success');
const profileAccessSuccess = new Counter('profile_access_success');
const authDuration = new Trend('auth_flow_duration');

// Configuración de la prueba de autenticación
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp-up: 0 -> 10 usuarios
    { duration: '30s', target: 50 },   // Ramp-up: 10 -> 50 usuarios
    { duration: '30s', target: 50 },   // Stay: mantener 50 usuarios
    { duration: '10s', target: 0 },    // Ramp-down: 50 -> 0 usuarios
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.1'],
    'register_success': ['count>0'],
    'login_success': ['count>0'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  const startTime = Date.now();
  
  // Generar credenciales únicas por VU e iteración
  const email = `testuser_${__VU}_${__ITER}_${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  const name = `Test User ${__VU}`;

  // ==================== GRUPO 1: REGISTRO ====================
  group('Registro de Usuario', function () {
    const registerPayload = JSON.stringify({
      email: email,
      password: password,
      name: name
    });

    const registerRes = http.post(`${BASE_URL}/auth/register`, registerPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'register' }
    });

    const registerChecks = check(registerRes, {
      'Register - Status 201': (r) => r.status === 201,
      'Register - Has userId': (r) => {
        try {
          return r.json('userId') !== undefined;
        } catch (e) {
          return false;
        }
      },
      'Register - Response time < 1s': (r) => r.timings.duration < 1000,
    });

    if (registerChecks) {
      registerSuccess.add(1);
    }
  });

  sleep(0.5);

  // ==================== GRUPO 2: LOGIN ====================
  let token = null;
  
  group('Login de Usuario', function () {
    const loginPayload = JSON.stringify({
      email: email,
      password: password
    });

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'login' }
    });

    const loginChecks = check(loginRes, {
      'Login - Status 200': (r) => r.status === 200,
      'Login - Has token': (r) => {
        try {
          const body = r.json();
          return body.token !== undefined && body.token !== null;
        } catch (e) {
          return false;
        }
      },
      'Login - Response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (loginChecks) {
      loginSuccess.add(1);
      try {
        token = loginRes.json('token');
      } catch (e) {
        token = null;
      }
    }
  });

  sleep(0.5);

  // ==================== GRUPO 3: ACCESO A PERFIL (PROTEGIDO) ====================
  if (token) {
    group('Acceso a Recursos Protegidos', function () {
      // GET /api/profile
      const profileRes = http.get(`${BASE_URL}/api/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'profile' }
      });

      const profileChecks = check(profileRes, {
        'Profile - Status 200': (r) => r.status === 200,
        'Profile - Has user data': (r) => {
          try {
            return r.json('user') !== undefined;
          } catch (e) {
            return false;
          }
        },
        'Profile - Response time < 300ms': (r) => r.timings.duration < 300,
      });

      if (profileChecks) {
        profileAccessSuccess.add(1);
      }

      sleep(0.3);

      // GET /api/data
      const dataRes = http.get(`${BASE_URL}/api/data`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'protected-data' }
      });

      check(dataRes, {
        'Protected Data - Status 200': (r) => r.status === 200,
        'Protected Data - Has message': (r) => {
          try {
            return r.json('message') !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      sleep(0.3);

      // POST /api/update-profile
      const updatePayload = JSON.stringify({
        name: `Updated User ${__VU} - ${Date.now()}`
      });

      const updateRes = http.post(`${BASE_URL}/api/update-profile`, updatePayload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'update-profile' }
      });

      check(updateRes, {
        'Update Profile - Status 200': (r) => r.status === 200,
        'Update Profile - Has updated user': (r) => {
          try {
            return r.json('user') !== undefined;
          } catch (e) {
            return false;
          }
        },
      });
    });
  }

  // Registrar duración total del flujo de autenticación
  authDuration.add(Date.now() - startTime);

  sleep(1);
}

// Función de configuración (setup) - se ejecuta una vez antes de la prueba
export function setup() {
  // Verificar que el servidor está disponible
  const healthRes = http.get(`${BASE_URL}/health`);
  
  if (healthRes.status !== 200) {
    throw new Error(`El servidor no responde correctamente. Status: ${healthRes.status}`);
  }

  console.log('✅ Servidor verificado y listo para pruebas de autenticación');
  return { startTime: Date.now() };
}

// Función de limpieza (teardown) - se ejecuta una vez después de la prueba
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`⏱️ Prueba completada en ${duration.toFixed(2)} segundos`);
}
