# 📊 Análisis Comparativo de Carga - K6

**Fecha:** 7 de Enero de 2026  
**Tipo de Prueba:** Pruebas de carga comparativas  
**Parámetros:** VUs variables (100, 150, 200, 300) | Duración: 30s por prueba

---

## 📈 Tabla Comparativa de Métricas

| VUs | Avg Duration (ms) | P(95) (ms) | Failed Requests | Total Requests |
|-----|-------------------|-----------|-----------------|----------------|
| **100** | 279.64 | 509.24 | 0 | 2,390 |
| **150** | 940.84 | 4,827.79 | 0 | 2,577 |
| **200** | 296.30 | 548.93 | 0 | 4,724 |
| **300** | 359.36 | 723.03 | 45 | 6,747 |

---

## 🔍 Análisis por Nivel de Carga

### ✅ 100 VUs - Rendimiento Óptimo
- **Duración Promedio:** 279.64 ms
- **P(95):** 509.24 ms
- **Estado:** Sistema operando óptimamente
- **Recomendación:** Baseline de producción

### ⚠️ 150 VUs - Degradación Significativa
- **Duración Promedio:** 940.84 ms (**+237% vs 100 VUs**)
- **P(95):** 4,827.79 ms (**+847% vs 100 VUs**)
- **Estado:** Contención crítica de recursos
- **Recomendación:** No operar sin optimizaciones

### ✅ 200 VUs - Recuperación Parcial
- **Duración Promedio:** 296.30 ms (similar a 100 VUs)
- **P(95):** 548.93 ms (aceptable)
- **Throughput:** 4,724 requests (máximo hasta ahora)
- **Recomendación:** Nivel objetivo de operación

### ❌ 300 VUs - Límite de Capacidad
- **Duración Promedio:** 359.36 ms
- **P(95):** 723.03 ms
- **Fallos:** 45 solicitudes (0.66%)
- **Estado:** Sistema en límite máximo
- **Recomendación:** Escalado requerido

---

## 📊 Gráficos Generados

### Archivo: `metricas-comparativas.png`
Contiene 4 gráficos:
1. **Duración Promedio vs VUs** - Tendencia de latencia
2. **Percentil 95 vs VUs** - Cola de distribución
3. **Solicitudes Fallidas vs VUs** - Tasa de error
4. **Total Solicitudes vs VUs** - Throughput procesado

### Archivo: `distribucion-duraciones.png`
Contiene 4 histogramas:
- Distribución de tiempos de respuesta para cada nivel de VUs
- Visualización de promedio y P(95) por distribución

---

## 📌 Conclusiones Principales

### Capacidades Identificadas
- **Operación Normal:** 100 VUs (sin degradación)
- **Operación Aceptable:** 200 VUs (tolerable)
- **Límite Máximo:** 300 VUs (con fallos)

### Anomalía Detectada
⚠️ **Recuperación anómala:** El rendimiento en 200 VUs es mejor que en 150 VUs
- Sugiere auto-balancing o redistribución de carga
- Requiere investigación adicional

### Métricas Globales
- **Total Solicitudes Procesadas:** 16,438
- **Tasa de Error Global:** 0.27% (solo en 300 VUs)
- **Throughput Máximo:** 215.86 req/s (300 VUs)
- **Mejor Latencia:** 279.64 ms (100 VUs)

---

## 🎯 Recomendaciones de Acción

### Inmediato (1-2 semanas)
- [ ] Mantener carga operativa ≤ 200 VUs
- [ ] Implementar alertas en P(95) > 500ms
- [ ] Monitoreo en tiempo real

### Corto Plazo (1 mes)
- [ ] Investigar anomalía en 150 VUs
- [ ] Optimizar consultas de BD
- [ ] Aumentar pool de conexiones
- [ ] Implementar caché

### Mediano Plazo (1-3 meses)
- [ ] Escalado horizontal automático
- [ ] Microservicios
- [ ] Load balancing distribuido

### Largo Plazo (3+ meses)
- [ ] CDN para contenido estático
- [ ] Replicación geográfica
- [ ] Arquitectura cloud-native

---

## 📁 Archivos Disponibles

### Datos Procesados
- `metricas-comparativas.txt` - Tabla de métricas en texto
- `ANALISIS-DETALLADO.txt` - Informe extenso con recomendaciones

### Visualizaciones
- `metricas-comparativas.png` - Gráficos principales
- `distribucion-duraciones.png` - Análisis de distribuciones

### Informe Web
- `analisis-completo.html` - Informe interactivo HTML

### Datos Crudos
- `test-100-vus.json` - Datos completos 100 VUs
- `test-150-vus.json` - Datos completos 150 VUs
- `test-200-vus.json` - Datos completos 200 VUs
- `test-300-vus.json` - Datos completos 300 VUs

---

## 🛠️ Scripts Utilizados

```bash
# Script de pruebas
./k6-scripts/metricas-comparativas.js

# Procesar resultados
python process-metrics.py

# Generar gráficos
python generate-charts.py
```

---

## 📊 Matriz de Decisión

| Carga (VUs) | Latencia | Confiabilidad | Producción | Observaciones |
|-------------|----------|---------------|------------|--------------|
| 0-100 | ✅ Excelente | ✅ 100% | ✅ SÍ | Configuración recomendada |
| 100-200 | ✅ Buena | ✅ 99.9%+ | ✅ SÍ | Requiere monitoreo |
| 200-300 | ⚠️ Aceptable | ⚠️ 99.3% | ⚠️ CONDICIONAL | Necesario escalado |
| >300 | ❌ Inaceptable | ❌ <99% | ❌ NO | Requiere rediseño |

---

## ✅ Estado del Análisis

- [x] Pruebas completadas
- [x] Datos procesados
- [x] Gráficos generados
- [x] Análisis realizado
- [x] Recomendaciones formuladas
- [x] Informe documentado

**Versión:** 1.0  
**Estado:** COMPLETADO ✓

---

*Para más detalles, consultar `ANALISIS-DETALLADO.txt` o abrir `analisis-completo.html` en navegador*
