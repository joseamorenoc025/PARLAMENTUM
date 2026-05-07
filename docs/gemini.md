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
*   **Legisladores:** Nuevo feature "Conoce a tu legislador" vía QR y subpáginas.
*   **Auditoría:** Visor de logs inmutables operativo.

## 🚀 Próximos Pasos (Fase 4 Simplificada)
*   **Módulo Legisladores:** Refactorizar para generar subpáginas automáticas.
*   **Generador QR:** Optimizar para que apunte a las nuevas URLs de GitHub Pages.
*   **Cleanup:** Eliminar dependencias innecesarias de IA y servicios no utilizados.

## ✅ Checklist de Calidad
- [x] Validación de Input IPC con Zod.
- [x] Endpoint de Health Check (app:health).
- [x] Logger Winston configurado.
- [x] Sincronización con GitHub Database/JSON.
- [ ] Cobertura de tests IPC.
- [ ] Implementación de "Conoce a tu Legislador".
