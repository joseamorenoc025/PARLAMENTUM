#!/bin/bash
# scripts/security/audit-deps.sh
# Ejecutar npm audit para detectar vulnerabilidades en dependencias

mkdir -p reports

echo "🔍 Ejecutando npm audit..."

# Ejecutar audit y guardar JSON
npm audit --audit-level=high --json > reports/npm-audit.json 2>/dev/null

# Intentar parsear con jq si está disponible
if command -v jq &> /dev/null; then
  HIGH_VULNS=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' reports/npm-audit.json)
  
  if [ "$HIGH_VULNS" -gt 0 ]; then
    echo "❌ Se encontraron $HIGH_VULNS vulnerabilidades de alta/crítica."
    echo "💡 Ejecuta 'npm audit fix' para corregir automáticamente las que sea posible."
    exit 1
  else
    echo "✅ No hay vulnerabilidades de alta/crítica."
  fi
else
  echo "⚠️ jq no instalado. No se puede parsear el reporte automáticamente."
  echo "📄 Revisa reports/npm-audit.json manualmente."
fi
