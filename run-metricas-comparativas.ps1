# Script para ejecutar pruebas K6 con diferentes valores de VUs y guardar resultados

$vusValues = @(100, 150, 200, 300)
$resultsFile = ".\results\metricas-comparativas.txt"
$jsonResults = @()

# Limpiar o crear el archivo de resultados
$header = "METRICAS COMPARATIVAS - PRUEBAS K6"
$header += "`n" + ("=" * 80)
$header += "`nVUs | Avg Duration (ms) | P(95) Duration (ms) | Failed Requests | Total Requests"
$header += "`n" + ("-" * 80)
$header | Out-File -FilePath $resultsFile -Encoding UTF8

Write-Host "Iniciando pruebas con diferentes valores de VUs..."
Write-Host "================================================"

foreach ($vus in $vusValues) {
    Write-Host "`nEjecutando prueba con $vus VUs..."
    
    # Ejecutar K6 y capturar salida en JSON
    $jsonOutput = k6 run --vus $vus --duration 30s --out json=".\results\test-$vus-vus.json" ".\k6-scripts\metricas-comparativas.js" 2>&1
    
    Write-Host "Prueba con $vus VUs completada."
}

Write-Host "`n`nProcesando resultados..."
Write-Host "========================="

# Procesar cada archivo JSON para extraer métricas
foreach ($vus in $vusValues) {
    $jsonFile = ".\results\test-$vus-vus.json"
    
    if (Test-Path $jsonFile) {
        Write-Host "Procesando resultados de $vus VUs..."
        
        # Leer el archivo JSON
        $jsonContent = Get-Content $jsonFile | ConvertFrom-Json
        
        # Extraer métricas
        $avgDuration = $null
        $p95Duration = $null
        $failedRequests = 0
        $totalRequests = 0
        
        # Buscar en los puntos de datos
        foreach ($metric in $jsonContent) {
            if ($metric.type -eq "Point") {
                if ($metric.metric -eq "http_req_duration" -and $metric.data.tags.expected_response -eq "true") {
                    if ($metric.data.value -ne $null) {
                        if ($avgDuration -eq $null) {
                            $avgDuration = $metric.data.value
                        } else {
                            $avgDuration = ($avgDuration + $metric.data.value) / 2
                        }
                    }
                }
                if ($metric.metric -eq "http_req_failed") {
                    $failedRequests += $metric.data.value
                }
                if ($metric.metric -eq "http_reqs") {
                    $totalRequests = $metric.data.value
                }
            }
        }
        
        # Formato para escribir
        $line = "$vus | {0:F2} | {1:F2} | $failedRequests | $totalRequests" -f $avgDuration, $p95Duration
        $line | Out-File -FilePath $resultsFile -Append -Encoding UTF8
    }
}

Write-Host "`n`nResultados guardados en: $resultsFile"
Get-Content $resultsFile
