#!/bin/bash
# scripts/security/scan-secrets.sh
# Ejecutar gitleaks localmente para detectar secretos

mkdir -p reports

echo "🔍 Iniciando escaneo de secretos con Gitleaks..."

if command -v gitleaks &> /dev/null; then
  gitleaks detect --source . --report-path reports/gitleaks-report.json --redact --config .gitleaks.toml
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ No se detectaron secretos expuestos."
  else
    echo "❌ Se detectaron posibles secretos! Revisa reports/gitleaks-report.json"
    exit $EXIT_CODE
  fi
else
  echo "⚠️ Gitleaks no está instalado en este sistema."
  echo "💡 Instalar con: brew install gitleaks (macOS) o descarga desde https://github.com/gitleaks/gitleaks"
  exit 1
fi
