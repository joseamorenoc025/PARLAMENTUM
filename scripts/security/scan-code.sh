#!/bin/bash
# scripts/security/scan-code.sh
# Ejecutar Semgrep localmente para detectar patrones inseguros

mkdir -p reports

echo "🔍 Iniciando análisis estático con Semgrep..."

if command -v semgrep &> /dev/null; then
  semgrep scan --config .semgrep.yml --config auto --error --output reports/semgrep-report.json
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ No se detectaron vulnerabilidades críticas."
  else
    echo "⚠️ Se detectaron hallazgos de seguridad! Revisa reports/semgrep-report.json"
    exit $EXIT_CODE
  fi
else
  echo "⚠️ Semgrep no está instalado localmente."
  echo "💡 Instalar con: pip install semgrep o brew install semgrep"
  exit 1
fi
