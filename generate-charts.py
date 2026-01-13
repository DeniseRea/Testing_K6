import json
import os
import statistics
import matplotlib.pyplot as plt
import matplotlib
from pathlib import Path

matplotlib.use('Agg')  # Use non-interactive backend

def extract_metrics_from_json(json_file):
    """Extrae métricas de un archivo JSON de K6"""
    metrics = {
        'durations': [],
        'failed_requests': 0,
        'total_requests': 0
    }
    
    try:
        with open(json_file, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    
                    if data.get('type') == 'Point' and data.get('metric') == 'http_req_duration':
                        tags = data.get('data', {}).get('tags', {})
                        if tags.get('expected_response') == 'true':
                            value = data.get('data', {}).get('value')
                            if value is not None:
                                metrics['durations'].append(value)
                    
                    if data.get('type') == 'Point' and data.get('metric') == 'http_req_failed':
                        if data.get('data', {}).get('value') == 1:
                            metrics['failed_requests'] += 1
                        
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Error leyendo {json_file}: {e}")
        return None
    
    if metrics['total_requests'] == 0 and metrics['durations']:
        metrics['total_requests'] = len(metrics['durations'])
    
    return metrics

def calculate_percentile(data, p):
    """Calcula el percentil P de un conjunto de datos"""
    if not data:
        return 0
    sorted_data = sorted(data)
    index = int((p / 100.0) * len(sorted_data))
    index = min(index, len(sorted_data) - 1)
    return sorted_data[index]

# Valores de VUs a procesar
vus_values = [100, 150, 200, 300]
results_data = {}

print("Generando gráficos de métricas...")
print("-" * 50)

# Procesar cada archivo JSON
for vus in vus_values:
    json_file = f"results/test-{vus}-vus.json"
    
    if os.path.exists(json_file):
        print(f"Leyendo {json_file}...")
        metrics = extract_metrics_from_json(json_file)
        
        if metrics:
            results_data[vus] = metrics
            avg_dur = statistics.mean(metrics['durations']) if metrics['durations'] else 0
            p95_dur = calculate_percentile(metrics['durations'], 95)
            print(f"  ✓ VUs: {vus} | Avg: {avg_dur:.2f}ms | P(95): {p95_dur:.2f}ms | Total: {metrics['total_requests']}")

# Preparar datos para gráficos
vus_list = sorted(results_data.keys())
avg_durations = []
p95_durations = []
failed_counts = []
total_requests_list = []

for vus in vus_list:
    metrics = results_data[vus]
    avg_dur = statistics.mean(metrics['durations']) if metrics['durations'] else 0
    p95_dur = calculate_percentile(metrics['durations'], 95)
    
    avg_durations.append(avg_dur)
    p95_durations.append(p95_dur)
    failed_counts.append(metrics['failed_requests'])
    total_requests_list.append(metrics['total_requests'])

# Crear figura con múltiples subgráficos
fig, axes = plt.subplots(2, 2, figsize=(14, 10))
fig.suptitle('Análisis Comparativo de Carga - Pruebas K6', fontsize=16, fontweight='bold')

# Gráfico 1: Duración promedio
ax1 = axes[0, 0]
ax1.plot(vus_list, avg_durations, marker='o', linewidth=2, markersize=8, color='#2E86AB')
ax1.fill_between(vus_list, avg_durations, alpha=0.3, color='#2E86AB')
ax1.set_xlabel('VUs (Usuarios Virtuales)', fontweight='bold')
ax1.set_ylabel('Duración Promedio (ms)', fontweight='bold')
ax1.set_title('Duración Promedio vs VUs')
ax1.grid(True, alpha=0.3)
for i, v in enumerate(vus_list):
    ax1.text(v, avg_durations[i], f'{avg_durations[i]:.0f}ms', ha='center', va='bottom')

# Gráfico 2: Percentil 95
ax2 = axes[0, 1]
ax2.plot(vus_list, p95_durations, marker='s', linewidth=2, markersize=8, color='#A23B72')
ax2.fill_between(vus_list, p95_durations, alpha=0.3, color='#A23B72')
ax2.set_xlabel('VUs (Usuarios Virtuales)', fontweight='bold')
ax2.set_ylabel('Percentil 95 (ms)', fontweight='bold')
ax2.set_title('Percentil 95 (P95) vs VUs')
ax2.grid(True, alpha=0.3)
for i, v in enumerate(vus_list):
    ax2.text(v, p95_durations[i], f'{p95_durations[i]:.0f}ms', ha='center', va='bottom')

# Gráfico 3: Solicitudes fallidas
ax3 = axes[1, 0]
colors_bar = ['#06A77D' if f == 0 else '#D62828' for f in failed_counts]
bars = ax3.bar(vus_list, failed_counts, color=colors_bar, alpha=0.7, edgecolor='black', linewidth=1.5)
ax3.set_xlabel('VUs (Usuarios Virtuales)', fontweight='bold')
ax3.set_ylabel('Solicitudes Fallidas', fontweight='bold')
ax3.set_title('Solicitudes Fallidas vs VUs')
ax3.set_xticks(vus_list)
ax3.grid(True, alpha=0.3, axis='y')
for i, (v, f) in enumerate(zip(vus_list, failed_counts)):
    ax3.text(v, f, str(f), ha='center', va='bottom', fontweight='bold')

# Gráfico 4: Total de solicitudes procesadas
ax4 = axes[1, 1]
ax4.bar(vus_list, total_requests_list, color='#F18F01', alpha=0.7, edgecolor='black', linewidth=1.5)
ax4.set_xlabel('VUs (Usuarios Virtuales)', fontweight='bold')
ax4.set_ylabel('Total de Solicitudes', fontweight='bold')
ax4.set_title('Total de Solicitudes Procesadas vs VUs')
ax4.set_xticks(vus_list)
ax4.grid(True, alpha=0.3, axis='y')
for i, (v, t) in enumerate(zip(vus_list, total_requests_list)):
    ax4.text(v, t, str(t), ha='center', va='bottom', fontweight='bold')

plt.tight_layout()
plt.savefig('results/metricas-comparativas.png', dpi=300, bbox_inches='tight')
print("\n✓ Gráfico guardado: results/metricas-comparativas.png")

# Crear gráfico adicional: Distribución de duraciones por VU
fig2, axes2 = plt.subplots(2, 2, figsize=(14, 10))
fig2.suptitle('Distribución de Tiempos de Respuesta por Carga', fontsize=16, fontweight='bold')

for idx, vus in enumerate(vus_list):
    row = idx // 2
    col = idx % 2
    ax = axes2[row, col]
    
    metrics = results_data[vus]
    durations = metrics['durations'][:1000]  # Limitar a 1000 para mejor visualización
    
    ax.hist(durations, bins=50, color='#2E86AB', alpha=0.7, edgecolor='black')
    ax.axvline(statistics.mean(durations), color='red', linestyle='--', linewidth=2, label=f'Promedio: {statistics.mean(durations):.0f}ms')
    ax.axvline(calculate_percentile(durations, 95), color='orange', linestyle='--', linewidth=2, label=f'P(95): {calculate_percentile(durations, 95):.0f}ms')
    ax.set_xlabel('Duración (ms)', fontweight='bold')
    ax.set_ylabel('Frecuencia', fontweight='bold')
    ax.set_title(f'Distribución con {vus} VUs')
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('results/distribucion-duraciones.png', dpi=300, bbox_inches='tight')
print("✓ Gráfico guardado: results/distribucion-duraciones.png")

print("\n✓ Generación de gráficos completada")
print("  - Gráfico principal: results/metricas-comparativas.png")
print("  - Distribución: results/distribucion-duraciones.png")
