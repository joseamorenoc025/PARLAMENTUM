# Segundo Cerebro Legislativo - Roadmap & Especificaciones

## 🔐 Seguridad & Auditoría
*   **Audit Logs Inmutables:** Registro de todas las acciones críticas con hash encadenado.
*   **RBAC (Role Based Access Control):** admin, secretario, legislador, viewer.
*   **Cifrado de Documentos:** AES-256-GCM para documentos sensibles.

## 🗄️ Stack Tecnológico
*   **Runtime:** Electron 30.0.0
*   **Frontend:** React 18.3, TailwindCSS, Lucide-React
*   **Base de Datos:** SQLite (better-sqlite3)
*   **Logging:** Winston
*   **QR:** qrcode.js

## 🧩 Módulos Implementados
*   **Dashboard:** Resumen mensual de sesiones, oficios y proyectos.
*   **Sesiones:** Gestión de sesiones ordinarias, extraordinarias y especiales.
*   **Oficios Salientes:** Control de comunicaciones oficiales.
*   **Agenda Legislativa:** Seguimiento de proyectos de ley por fases.
*   **Legisladores & Comisiones:** Directorio de miembros y organización de comisiones.
*   **Bóveda Documental:** Almacenamiento y subida de archivos (PDF/Word).

## 🚀 Próximos Pasos (Fase 3 & 4)
*   **Módulo 1: Biblioteca de Leyes con QR:** Generación de QR único para acceso público a leyes sancionadas.
*   **Módulo 2: Versionado de Proyectos:** Snapshots de proyectos de ley en cada cambio de fase.
*   **Módulo 3: Auditoría & Backup:** Implementar `audit_logs` en SQLite y sistema de respaldo automático.

## 🛠️ Guía de Desarrollo
1. `npm install`
2. `npm run db:migrate`
3. `npm run dev`

## ✅ Checklist de Calidad
- [x] UI Responsiva y Modo Oscuro.
- [x] Persistencia en SQLite (Migración de localStorage completada).
- [x] Gestión de archivos en Bóveda.
- [x] Registro de logs en `combined.log` y `error.log`.
