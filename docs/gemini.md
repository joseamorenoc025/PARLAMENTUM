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
*   **Dashboard:** Resumen mensual de sesiones, oficios y proyectos.
*   **Sesiones & Oficios:** Gestión completa con numeración correlativa.
*   **Agenda Legislativa:** Seguimiento tipo Kanban con snapshots.
*   **Biblioteca de Leyes 1.0 (GitHub Sync):** Sincronización con GitHub Pages para visualización pública de leyes cargadas.
*   **Bóveda Documental:** Carga de expedientes y vinculación de links externos (Drive).

## 🚀 Próximos Pasos (Fase 4 & 5)
*   **Módulo: Gestión de Usuarios Pro:** Panel administrativo para control de personal (Alta/Baja/Roles).
*   **Módulo: Recuperación de Contraseña:** Implementación de preguntas de seguridad o reseteo vía Admin.
*   **Módulo: Biblioteca 2.0:** Generación de QR nativa dentro de la app e integración fluida de links Drive.
*   **Backup & Nube:** Alternativas de respaldo manual y sincronización simplificada (MVP).
*   **Calidad:** Cobertura de tests > 80% y auditoría final.

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
