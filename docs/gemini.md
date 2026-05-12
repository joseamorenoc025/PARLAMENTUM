# Segundo Cerebro Legislativo - Roadmap & Especificaciones

## 🔐 Seguridad & Auditoría
*   **Audit Logs:** Implementados con Hash Chain (SHA-256).
*   **Seguridad IPC:** Validación estricta con **Zod** (Completado).
*   **Roles:** Admin (Secretario de Cámara), Legislador, Viewer.

## 🗄️ Tecnologías
*   **Core:** Electron 30, React 18, SQLite (Drizzle).
*   **Visibilidad:** GitHub Pages para visualización pública de leyes y legisladores.
*   **Cloud:** Enlaces a Google Drive para documentos.

## 🧩 Estado de Módulos
*   **Dashboard:** Operativo con métricas en tiempo real.
*   **Agenda Legislativa:** Kanban funcional con snapshots.
*   **Leyes:** Simplificado. Carga de links Drive + sincronización JSON a GitHub.
*   **Legisladores:** (Completado) QR Único institucional + Portal dinámico de perfiles.
*   **Auditoría:** Visor de logs inmutables operativo.

## 🚀 Próximos Pasos (Fase 5: Consolidación)
*   **Firma Digital de Auditoría:** Implementar lógica de Hash Chain en el Main Process.
*   **Seguridad:** Corregir handler `db:query` y mejorar hashing de preguntas de seguridad.
*   **Mantenimiento:** Optimizar sincronización de imágenes y backups.

## ✅ Checklist de Calidad
- [x] Validación de Input IPC con Zod.
- [x] Endpoint de Health Check (app:health).
- [x] Logger Winston configurado.
- [x] Sincronización con GitHub Database/JSON.
- [x] Implementación de "Conoce a tus Legisladores" (QR Unificado).
- [ ] Cobertura de tests IPC.

