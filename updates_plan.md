# 🗺️ Plan de Mejoras y Roadmap: Cerebro Legislativo

Este documento detalla la ruta hacia la versión 1.0 (Open Source Ready), priorizando la simplicidad, la ligereza y la transparencia.

## 📈 Estado de Implementación

| ID | Mejora | Estado | Prioridad |
| :--- | :--- | :--- | :--- |
| 1 | GitHub Actions: Optimizaciones (Reusable setup) | 🟡 Pendiente | Media |
| 2 | Testing: Integración IPC + E2E (Playwright) | 🟡 Pendiente | Alta |
| 3 | Base de Datos: Drizzle Kit (Studio & Check) | ✅ Completado | Media |
| 4 | Observabilidad: Logger + Health Check | ✅ Completado | Media |
| 5 | Seguridad: Validación de Input IPC (Zod) | ✅ Completado | Alta |
| 6 | Calidad: Cobertura + Changelog Automático | 🟡 Pendiente | Baja |
| 7 | Distribución: Releases Automáticos (.exe, .dmg) | 🟡 Pendiente | Media |
| 8 | Biblioteca de Leyes 2.0 (QR + GitHub Pages) | 🚀 En Curso | Crítica |
| 9 | Módulo: Conoce a tu Legislador (Subpages) | 🚀 En Curso | Media |
| 10 | Sincronización: GitHub Sync (Database/JSON) | 🟢 Implementado | Alta |

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

## 📅 Próximos Pasos Inmediatos

1. **Refactorizar el módulo de Leyes:** Ajustar para que solo maneje metadatos y enlaces de Drive.
2. **Implementar Generador de Subpages:** Crear la lógica para exportar legisladores a GitHub Pages.
3. **Optimización de Releases:** Asegurar que los instaladores se generen correctamente con el nuevo flujo.

---
*Nota: Se ha descartado la implementación de IA Legislativa y el Sistema de Plugins complejo para mantener la aplicación ligera y fácil de mantener.*
