# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [1.0.0] - 2026-05-19

### Añadido (Added)
- **Portal Ciudadano PWA**: Nueva interfaz web pública con estadísticas, soporte offline (Service Worker) y contadores de descarga de documentos.
- **Autenticación BIP39**: Nuevo sistema de login monousuario que reemplaza las preguntas de seguridad por una frase de recuperación de 12 palabras (exportable a PDF).
- **Despliegue CI/CD Automático**: Implementación de GitHub Actions para compilar y desplegar el Portal Ciudadano, eliminando el proceso de sincronización manual y corrigiendo errores 403/404.
- **Estampado PDF y QR**: Validación y autenticidad de Acuerdos de Cámara usando códigos QR incrustados dinámicamente en los archivos PDF generados.
- **Métricas Legislativas**: Dashboard animado en CSS puro con variables HSL para reflejar la popularidad y el estado de los proyectos legislativos de forma pública.

### Seguridad (Security)
- **Mitigación XSS (Cross-Site Scripting)**: Refactorización en el portal ciudadano para usar textContent en lugar de innerHTML y escape de cadenas para todas las variables inyectadas.
- **Cifrado DPAPI**: Integración con `safeStorage` nativo de Electron para cifrar de manera robusta los tokens de acceso de GitHub.

### Mejorado (Changed)
- Identidad del proyecto actualizada a **PARLAMENTUM**.
- El asistente de Onboarding ahora es más fluido y centraliza la captura de datos institucionales.
- Base de datos fortalecida contra esquemas corruptos mediante `migrate.js` automatizado.
