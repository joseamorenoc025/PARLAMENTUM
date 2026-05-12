#!/bin/bash
# scripts/security/generate-report.sh
# Consolidar resultados de escaneos de seguridad en un reporte único

mkdir -p reports
REPORT_DATE=$(date +%Y-%m-%d)
OUTPUT="reports/security-summary-$REPORT_DATE.md"

echo "🔍 Generando reporte consolidado de seguridad..."

cat > "$OUTPUT" << EOF
# 🔐 Reporte de Seguridad - $REPORT_DATE
## Proyecto: cerebro_legislativo

### 1. Escaneo de Secretos (Gitleaks)
EOF

if [ -f reports/gitleaks-report.json ]; then
    FINDINGS=$(jq '. | length' reports/gitleaks-report.json 2>/dev/null || echo "Error")
    echo "- Hallazgos detectados: $FINDINGS" >> "$OUTPUT"
    echo "- Detalle: Ver [reports/gitleaks-report.json](gitleaks-report.json)" >> "$OUTPUT"
else
    echo "- ℹ️ No se encontró reporte de Gitleaks. Ejecuta 'bash scripts/security/scan-secrets.sh'." >> "$OUTPUT"
fi

cat >> "$OUTPUT" << EOF

### 2. Análisis Estático (Semgrep)
EOF

if [ -f reports/semgrep-report.json ]; then
    # Semgrep JSON structure is usually {"results": [...]}
    FINDINGS=$(jq '.results | length' reports/semgrep-report.json 2>/dev/null || echo "Error")
    echo "- Hallazgos detectados: $FINDINGS" >> "$OUTPUT"
    echo "- Detalle: Ver [reports/semgrep-report.json](semgrep-report.json)" >> "$OUTPUT"
else
    echo "- ℹ️ No se encontró reporte de Semgrep. Ejecuta 'bash scripts/security/scan-code.sh'." >> "$OUTPUT"
fi

cat >> "$OUTPUT" << EOF

### 3. Auditoría de Dependencias (npm audit)
EOF

if [ -f reports/npm-audit.json ]; then
    HIGH=$(jq '.metadata.vulnerabilities.high' reports/npm-audit.json 2>/dev/null || echo "0")
    CRITICAL=$(jq '.metadata.vulnerabilities.critical' reports/npm-audit.json 2>/dev/null || echo "0")
    echo "- Vulnerabilidades Altas: $HIGH" >> "$OUTPUT"
    echo "- Vulnerabilidades Críticas: $CRITICAL" >> "$OUTPUT"
    echo "- Detalle: Ver [reports/npm-audit.json](npm-audit.json)" >> "$OUTPUT"
else
    echo "- ℹ️ No se encontró reporte de npm audit. Ejecuta 'bash scripts/security/audit-deps.sh'." >> "$OUTPUT"
fi

cat >> "$OUTPUT" << EOF

---
### 🛡️ Próximos Pasos Recomendados
- [ ] Revisar hallazgos de alta prioridad en los archivos JSON.
- [ ] Ejecutar 'npm audit fix --force' si las vulnerabilidades persisten (precaución: cambios drásticos).
- [ ] Verificar alertas en la pestaña 'Security' de GitHub (CodeQL).
EOF

echo "✅ Reporte generado exitosamente en: $OUTPUT"
