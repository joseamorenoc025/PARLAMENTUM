# Política de Seguridad

Nos tomamos la seguridad de la información legislativa muy en serio. PARLAMENTUM se compromete a mantener estándares robustos para proteger tanto a las Secretarías de Cámara como a los ciudadanos.

## Reporte de Vulnerabilidades

Si descubres una vulnerabilidad de seguridad en PARLAMENTUM, por favor **no** crees un issue público en GitHub.
En su lugar, envía un correo electrónico directamente a los mantenedores del proyecto. Te responderemos en un plazo máximo de 48 horas con los siguientes pasos.

## Mitigaciones Actuales en el Sistema

*   **Prevención de XSS:** Todo el texto dinámico inyectado en el Portal Ciudadano web se escapa apropiadamente usando manipulaciones del DOM seguras (`textContent`) en lugar de `innerHTML`.
*   **Seguridad de Credenciales:** Los tokens de la nube (API de GitHub) nunca se almacenan de forma predeterminada ni en texto claro; se blindan usando el módulo de encriptación del sistema operativo (`electron.safeStorage`).
*   **Recuperación Segura:** No usamos preguntas de seguridad basadas en "respuestas memorizables" que pueden ser objeto de ingeniería social. Se exige una frase BIP39 de alta entropía (12 palabras) como única llave de recuperación de administrador.

## Soporte de Versiones

| Versión | Soportada | Notas |
| :--- | :--- | :--- |
| >= 1.0.x | Sí | Rama estable actual. Recibe parches de seguridad. |
| < 1.0.0 | No | Versiones Beta sin soporte. |
