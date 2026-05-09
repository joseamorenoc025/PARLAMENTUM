# 🗺️ Plan de Mejoras y Roadmap: Cerebro Legislativo

Este documento detalla la ruta hacia la versión 1.0 (Open Source Ready), priorizando la simplicidad, la ligereza y la transparencia.

## 📈 Estado de Implementación

| ID | Mejora | Estado | Prioridad |
| :--- | :--- | :--- | :--- |
| 1 | GitHub Actions: CI/CD (Auto-Release .exe) | ✅ Completado | Alta |
| 2 | Testing: Integración IPC + E2E (Playwright) | ✅ Completado | Alta |
| 3 | Base de Datos: Drizzle Kit (Studio & Check) | ✅ Completado | Media |
| 4 | Observabilidad: Logger + Health Check | ✅ Completado | Media |
| 5 | Seguridad: Validación de Input IPC (Zod) | ✅ Completado | Alta |
| 6 | Calidad: Cobertura + Changelog Automático | 🟡 Pendiente | Baja |
| 7 | Distribución: Releases Automáticos (.exe, .dmg) | 🟡 Pendiente | Media |
| 8 | Biblioteca de Leyes 2.0 (QR + Search Index) | ✅ Completado | Crítica |
| 9 | Módulo: Conoce a tu Legislador 2.0 | 📅 Planificado | Media |
| 10 | Sincronización: GitHub Sync (Database/JSON) | ✅ Completado | Alta |
| 11 | Sistema de Backup: Local Cifrado (Fase 1) | ✅ Completado | Crítica |
| 12 | Sistema de Backup: Cloud (Drive/GitHub) | 🚀 Planificado | Alta |
| 13 | Analytics: Métricas Anónimas (Opt-in) | ✅ Completado | Media |
| 14 | Auditoría de Integridad: "Anti-Ghosting" | ✅ Completado | Alta |
| 15 | Seguridad: Sello de Integridad (SHA-256) | ✅ Completado | Alta |
| 16 | Reportes: Generador de Informes de Gestión | ✅ Completado | Media |
| 17 | Distribución: Auto-Updates (GitHub) | ✅ Completado | Media |
| 18 | Sincronización: Flujo Oficina-Casa | ✅ Completado | Alta |
| 19 | Reportes 2.0: Logo + Acuerdos de Cámara | 📅 Planificado | Media |

---

## 🛠️ Detalles de Implementación (Versión Simplificada)

### 1. Biblioteca de Leyes (Ultra-Lightweight)
**Estrategia:** Eliminación total de procesamiento de archivos pesados.
- **Flujo:** La app guarda exclusivamente metadatos y el enlace de **Google Drive**. Se elimina el motor de extracción de texto (FileIngestor) para maximizar la ligereza.
- **Publicación:** Los metadatos se sincronizan con un repositorio de **GitHub Pages** en formato JSON.
- **Acceso:** Se genera un **Código QR** que apunta a una SPA (Single Page Application) en GitHub que lee el JSON y permite la descarga desde Drive.

### 2. Módulo: Conoce a tu Legislador (JSON Dinámico)
**Estrategia:** Visibilidad pública mediante datos estructurados.
- **Gestión:** La app gestiona la info del legislador y la exporta a un archivo JSON centralizado en GitHub.
- **Visualización:** Una web genérica (SPA) en GitHub Pages recibe el ID del legislador por URL y renderiza dinámicamente su perfil.
- **Acceso:** Códigos QR únicos por legislador vinculados a la URL dinámica.

### 3. Roles y Acceso Restringido
**Estrategia:** El sistema es para uso exclusivo de la Secretaría.
- **Usuario Único:** Solo el **Secretario de Cámara** tiene acceso a la aplicación.
- **Reglamentación:** Se eliminan los accesos para legisladores dentro de la app para cumplir con el reglamento de competencias.
- **Seguridad:** Autenticación simplificada centrada en una única figura administrativa.

### 4. Seguridad y Observabilidad (Auditado ✅)
- **Zod:** Validación estricta en todos los canales IPC para prevenir inyecciones.
- **Logger Winston:** Registro de errores y actividad crítica en archivos locales.
- **Health Check:** Endpoint `app:health` para diagnóstico rápido del sistema.

---

### 4. Sistema de Backup y Resiliencia (v1.1.0)
**Estrategia:** Protección total de datos legislativos.
- **Fase 1 (Local):** Cifrado AES-256-GCM implementado. Exportación manual (.clbak) y restauración desde el login funcional.
- **Fase 2 (Google Drive):** Integración con Google API para respaldos automáticos en la nube. Pendiente.
- **Fase 3 (GitHub Cloud):** Repositorio privado como alternativa de almacenamiento seguro. Pendiente.

---

## 📅 Próximos Pasos Inmediatos

1. **Pruebas de Estrés en Backup:** Verificar integridad con bases de datos de gran tamaño (>100MB).
2. **Implementar Fase 2 (Google Drive):** Iniciar configuración de OAuth2.
3. **Reportes 2.0:** Integrar logo institucional y el nuevo módulo de "Acuerdos de Cámara" en el PDF.

---
*Nota: Se ha descartado la implementación de IA Legislativa y el Sistema de Plugins complejo para mantener la aplicación ligera y fácil de mantener.*
