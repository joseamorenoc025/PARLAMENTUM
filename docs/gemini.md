# Segundo Cerebro Legislativo - Roadmap & Especificaciones

## 🔐 Seguridad & Auditoría
*   **Audit Logs Inmutables:** Registro de todas las acciones críticas con hash encadenado (Signature).
*   **RBAC (Role Based Access Control):** admin, secretario, legislador, viewer.
*   **Encriptación:** Hashing de contraseñas con bcryptjs y SHA-256 para integridad de logs.

## 🗄️ Stack Tecnológico
*   **Runtime:** Electron 30.0.0
*   **Frontend:** React 18.3, TailwindCSS, Lucide-React
*   **Base de Datos:** SQLite (better-sqlite3) con migraciones automáticas.
*   **Seguridad:** bcryptjs, crypto-js.
*   **APIs Externas:** Google Drive API (v3) para copias de seguridad en la nube.

## 🧩 Módulos Implementados
*   **Autenticación:** Sistema de Sign-In / Sign-Up con medidor de fortaleza de contraseña.
*   **Dashboard:** Resumen mensual de sesiones, oficios y proyectos con semáforo de estancamiento.
*   **Sesiones:** Gestión completa con numeración correlativa manual/automática.
*   **Oficios Salientes:** Control de comunicaciones oficiales vinculadas a sesiones.
*   **Agenda Legislativa:** Seguimiento tipo Kanban (6 fases) con snapshots de versión.
*   **Legisladores & Comisiones:** Directorio ampliado con junta directiva y soporte para miembros ciudadanos (M-III).
*   **Bóveda Documental:** Carga y descarga de expedientes PDF/Word.

## 🚀 Próximos Pasos (Fase 3 & 4)
*   **Módulo: Biblioteca de Leyes 2.0 (Pequeñas cosas pendientes):**
    *   Implementar selector de archivos PDF real para cada ley registrada.
    *   Integrar con Google Drive para alojar los PDFs públicamente.
    *   Generar QR con el enlace de descarga directa del PDF en Drive para acceso ciudadano.
*   **Módulo: Gestión de Usuarios Pro:** Panel administrativo para el Admin para gestionar el personal (Alta/Baja de usuarios).
*   **Módulo: Automatización de Backup Cloud:** Sincronización automática de `legis.db` con Google Drive al cerrar el sistema.

## 🛠️ Guía de Desarrollo
1. `npm install`
2. `npm run dev` (Las tablas se crean automáticamente al iniciar)

## ✅ Checklist de Calidad
- [x] UI Responsiva y Modo Oscuro.
- [x] Modularización siguiendo principios SOLID.
- [x] Hash Chain activo en Auditoría.
- [x] Soporte para Miembros Ciudadanos en Comisiones.
- [x] Tablero Kanban operativo en Agenda.
- [x] Validación de Input IPC con Zod (Seguridad).
- [x] Endpoint de Health Check (app:health).
- [ ] Cobertura de tests > 80%.
- [ ] Exportación de datos a Google Drive automática.
