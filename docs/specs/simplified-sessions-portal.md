# Especificación: Portal de Sesiones Simplificado y Centralización Administrativa

## 📌 Contexto
Para optimizar la arquitectura y alinear el sistema con el reglamento institucional, se ha decidido simplificar la gestión de roles y la visualización de datos para legisladores.

## 🎯 Objetivos
1.  **Centralización Administrativa:** El rol de administrador queda reservado exclusivamente para el **Secretario de Cámara**, quien tiene la responsabilidad legal del despacho y fe pública.
2.  **Portal de Lectura:** Los legisladores accederán a la información de sesiones a través de un portal estático hospedado en **GitHub Pages**, desacoplando la consulta de la gestión local.

## 🛠️ Arquitectura Técnica

### 1. Flujo de Datos (Publicación)
El sistema seguirá un modelo de publicación editorial:
`DB Local (SQLite)` ➔ `Sync Engine (Electron)` ➔ `GitHub Repo (JSON/Markdown)` ➔ `GitHub Pages (Web)`

- **Escritura:** Solo desde la aplicación Electron (Secretario).
- **Lectura:** Portal web ligero y responsivo para Legisladores y público autorizado.

### 2. Cambios en Roles (RBAC)
- **Secretario de Cámara (Admin):** Control total sobre la carga de sesiones, leyes y oficios. Gestión de backups y sincronización.
- **Legislador:** Usuario de consulta. No requiere instalación de la app de escritorio para ver el orden del día o actas.

### 3. Implementación del Portal
- **Tecnología:** GitHub Pages (Markdown/Jekyll o un SPA simple en React/Vue).
- **Automatización:** Cada vez que el Secretario "Cierra" una sesión o pulsa "Sincronizar", el `syncEngine` empuja los cambios al repositorio, disparando un GitHub Action que actualiza el portal.

## ✅ Beneficios
- **Robustez:** La información de consulta está disponible incluso si la red local o el equipo del Secretario fallan.
- **Accesibilidad:** Consulta desde dispositivos móviles sin instalaciones previas.
- **Seguridad:** Elimina riesgos de modificación accidental por parte de usuarios de consulta.
- **Mantenibilidad:** Reduce la complejidad del código de gestión de usuarios (RBAC) en la aplicación principal.

## 📅 Próximos Pasos (Mañana)
- [ ] Refactorizar lógica de roles en `AuthScreen` y `Dashboard`.
- [ ] Configurar el `githubClient` para exportar un `index.json` de sesiones.
- [ ] Crear el template base para el portal en la rama `gh-pages` o carpeta `docs/`.
