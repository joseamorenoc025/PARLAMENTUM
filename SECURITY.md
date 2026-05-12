# Política de Seguridad de cerebro_legislativo

## Reportar una Vulnerabilidad
Si encuentras un problema de seguridad, por favor **NO** lo publiques en issues públicos. 
Envía un correo detallado a: [tu-email@dominio] o utiliza la función de "Private vulnerability reporting" de GitHub.

## Escaneos Automáticos
Este proyecto ejecuta automáticamente las siguientes herramientas en cada Push y Pull Request:
- 🔍 **Gitleaks**: Detección de secretos (API keys, tokens).
- 🛡️ **Semgrep**: Análisis estático de patrones inseguros (enfocado en Electron e IPC).
- 📦 **npm audit**: Auditoría de vulnerabilidades en dependencias (semanal).
- 🔬 **CodeQL**: Análisis profundo de código nativo de GitHub.

## Respuesta a Hallazgos
- **CRITICAL/ERROR**: Bloquean el merge y requieren corrección inmediata.
- **WARNING**: Se registran y se planifica su corrección en el siguiente ciclo de mantenimiento.
- **INFO**: Documentado, no requiere acción inmediata.
