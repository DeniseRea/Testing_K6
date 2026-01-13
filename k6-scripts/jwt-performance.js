import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Métricas personalizadas para rendimiento JWT
const registerDuration = new Trend('jwt_register_duration', true);
const loginDuration = new Trend('jwt_login_duration', true);
const tokenValidationDuration = new Trend('jwt_token_validation_duration', true);
const authSuccessRate = new Rate('auth_success_rate');
const tokenGenerations = new Counter('token_generations');

// Configuración enfocada en rendimiento de autenticación
export const options = {
    stages: [
        { duration: '5s', target: 20 },    // Ramp-up rápido
        { duration: '20s', target: 100 },  // Incrementar carga
        { duration: '20s', target: 100 },  // Mantener carga alta
        { duration: '5s', target: 0 },     // Ramp-down
    ],
    thresholds: {
        // Tiempos específicos de autenticación
        'jwt_register_duration': ['p(95)<800', 'avg<500'],
        'jwt_login_duration': ['p(95)<500', 'avg<300'],
        'jwt_token_validation_duration': ['p(95)<200', 'avg<100'],
        // Tasa de éxito
        'auth_success_rate': ['rate>0.9'],
        // Métricas HTTP generales
        'http_req_failed': ['rate<0.05'],
    },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
    const email = `perf_${__VU}_${__ITER}_${Date.now()}@example.com`;
    const password = 'PerfTest123!';

    // ==================== MEDIR REGISTRO ====================
    const registerStart = Date.now();

    const registerRes = http.post(
        `${BASE_URL}/auth/register`,
        JSON.stringify({
            email: email,
            password: password,
            name: 'Performance User'
        }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    registerDuration.add(Date.now() - registerStart);

    const registerOk = check(registerRes, {
        'Register successful': (r) => r.status === 201,
    });

    if (!registerOk) {
        authSuccessRate.add(false);
        return; // No continuar si el registro falla
    }

    sleep(0.2);

    // ==================== MEDIR LOGIN (GENERACIÓN DE TOKEN) ====================
    const loginStart = Date.now();

    const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({ email: email, password: password }),
        { headers: { 'Content-Type': 'application/json' } }
    );

    loginDuration.add(Date.now() - loginStart);

    let token = null;
    const loginOk = check(loginRes, {
        'Login successful': (r) => r.status === 200,
        'Token received': (r) => {
            try {
                token = r.json('token');
                return token !== null && token !== undefined;
            } catch (e) {
                return false;
            }
        },
        'Login time < 500ms': (r) => r.timings.duration < 500,
    });

    if (loginOk && token) {
        tokenGenerations.add(1);
    } else {
        authSuccessRate.add(false);
        return;
    }

    sleep(0.2);

    // ==================== MEDIR VALIDACIÓN DE TOKEN ====================
    // Realizar múltiples requests con el mismo token para medir validación
    for (let i = 0; i < 3; i++) {
        const validationStart = Date.now();

        const dataRes = http.get(`${BASE_URL}/api/data`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        tokenValidationDuration.add(Date.now() - validationStart);

        check(dataRes, {
            'Token validation successful': (r) => r.status === 200,
            'Validation time < 100ms': (r) => r.timings.duration < 100,
        });

        sleep(0.1);
    }

    // ==================== PRUEBA DE TOKEN INVÁLIDO ====================
    const invalidTokenRes = http.get(`${BASE_URL}/api/data`, {
        headers: { 'Authorization': 'Bearer invalid_token_12345' }
    });

    check(invalidTokenRes, {
        'Invalid token rejected': (r) => r.status === 403,
    });

    // ==================== PRUEBA SIN TOKEN ====================
    const noTokenRes = http.get(`${BASE_URL}/api/data`);

    check(noTokenRes, {
        'No token rejected': (r) => r.status === 401,
    });

    authSuccessRate.add(true);
    sleep(0.3);
}

// Setup: Verificar servidor y MongoDB
export function setup() {
    const healthRes = http.get(`${BASE_URL}/health`);

    if (healthRes.status !== 200) {
        throw new Error('Servidor no disponible');
    }

    // Verificar conexión MongoDB
    try {
        const healthData = healthRes.json();
        if (healthData.mongodb !== 'Connected') {
            console.warn('⚠️ MongoDB puede no estar conectado correctamente');
        } else {
            console.log('✅ MongoDB conectado');
        }
    } catch (e) {
        console.warn('⚠️ No se pudo verificar estado de MongoDB');
    }

    console.log('🚀 Iniciando prueba de rendimiento JWT');
    return { startTime: Date.now() };
}

// Teardown: Resumen de la prueba
export function teardown(data) {
    const totalTime = (Date.now() - data.startTime) / 1000;
    console.log(`\n📊 Resumen de Prueba JWT Performance`);
    console.log(`⏱️  Duración total: ${totalTime.toFixed(2)}s`);
    console.log(`📈 Revisa las métricas jwt_* para análisis detallado`);
}
