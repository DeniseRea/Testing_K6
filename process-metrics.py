import json
import os
import statistics
from pathlib import Path
import sys

def extract_metrics_from_json(json_file):
    """Extrae métricas de un archivo JSON de K6"""
    metrics = {
        'avg_duration': [],
        'failed_requests': 0,
        'total_requests': 0,
        'durations': []
    }
    
    try:
        with open(json_file, 'r') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    
                    # Extraer duración de las solicitudes HTTP
                    if data.get('type') == 'Point' and data.get('metric') == 'http_req_duration':
                        tags = data.get('data', {}).get('tags', {})
                        # Solo registrar requests exitosas
                        if tags.get('expected_response') == 'true':
                            value = data.get('data', {}).get('value')
                            if value is not None:
                                metrics['durations'].append(value)
                    
                    # Contar solicitudes fallidas
                    if data.get('type') == 'Point' and data.get('metric') == 'http_req_failed':
                        if data.get('data', {}).get('value') == 1:
                            metrics['failed_requests'] += 1
                    
                    # Contar solicitudes totales por métrica summary
                    if data.get('type') == 'TextSummary' and data.get('metric') == 'http_reqs':
                        summary_data = data.get('data', {})
                        if 'data' in summary_data:
                            # Buscar el total en los datos
                            lines = summary_data.get('data', '').split('\n')
                            for line_text in lines:
                                if 'Total' in line_text or 'total' in line_text:
                                    try:
                                        parts = line_text.split()
                                        for part in parts:
                                            if part.isdigit():
                                                metrics['total_requests'] = int(part)
                                                break
                                    except:
                                        pass
                        
                except json.JSONDecodeError:
                    continue
    except Exception as e:
        print(f"Error leyendo {json_file}: {e}")
        return None
    
    # Si no encontramos totales, contar las duraciones como proxy
    if metrics['total_requests'] == 0 and metrics['durations']:
        metrics['total_requests'] = len(metrics['durations'])
    
    metrics['avg_duration'] = metrics['durations']
    return metrics

def calculate_percentile(data, p):
    """Calcula el percentil P de un conjunto de datos"""
    if not data:
        return 0
    sorted_data = sorted(data)
    index = int((p / 100.0) * len(sorted_data))
    index = min(index, len(sorted_data) - 1)
    return sorted_data[index]

def format_results(vus_values, results_data):
    """Formatea los resultados para mostrar y guardar"""
    lines = []
    lines.append("=" * 100)
    lines.append("MÉTRICAS COMPARATIVAS - PRUEBAS K6")
    lines.append("=" * 100)
    lines.append("")
    lines.append(f"{'VUs':<8} | {'Avg Duration (ms)':<20} | {'P(95) (ms)':<15} | {'Failed Requests':<18} | {'Total Requests':<15}")
    lines.append("-" * 100)
    
    for vus in vus_values:
        if vus in results_data:
            data = results_data[vus]
            avg_duration = statistics.mean(data['avg_duration']) if data['avg_duration'] else 0
            p95_duration = calculate_percentile(data['avg_duration'], 95)
            failed = data['failed_requests']
            total = data['total_requests']
            
            line = f"{vus:<8} | {avg_duration:<20.2f} | {p95_duration:<15.2f} | {failed:<18} | {total:<15}"
            lines.append(line)
    
    lines.append("-" * 100)
    lines.append("")
    return "\n".join(lines)

# Valores de VUs a procesar
vus_values = [100, 150, 200, 300]
results_data = {}
results_file = "results/metricas-comparativas.txt"

print("Procesando resultados de pruebas K6...")
print("-" * 50)

# Procesar cada archivo JSON
for vus in vus_values:
    json_file = f"results/test-{vus}-vus.json"
    
    if os.path.exists(json_file):
        print(f"Procesando {json_file}...")
        metrics = extract_metrics_from_json(json_file)
        
        if metrics:
            results_data[vus] = metrics
            print(f"  ✓ {vus} VUs: {len(metrics['avg_duration'])} solicitudes procesadas")
        else:
            print(f"  ✗ Error procesando {vus} VUs")
    else:
        print(f"  ✗ Archivo no encontrado: {json_file}")

# Generar y mostrar resultados
print("\n")
formatted_results = format_results(vus_values, results_data)
print(formatted_results)

# Guardar resultados en archivo
print("\nGuardando resultados...")
try:
    with open(results_file, 'w', encoding='utf-8') as f:
        f.write(formatted_results)
    print(f"✓ Resultados guardados en: {results_file}")
except Exception as e:
    print(f"✗ Error guardando resultados: {e}")

print("\nProceso completado.")
