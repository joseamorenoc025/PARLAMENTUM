# Arquitectura: Segundo Cerebro Legislativo

Este documento describe la estructura y los flujos simplificados del sistema para garantizar ligereza y escalabilidad.

## 🏗️ Stack Tecnológico

- **Runtime:** Electron 30
- **Frontend:** React 18 + TailwindCSS
- **Persistencia:** SQLite vía Drizzle ORM
- **Publicación Web:** GitHub Pages (para Leyes y Legisladores)
- **Integración:** Google Drive (Almacenamiento de archivos pesados)
- **Seguridad:** Zod (IPC Validation) + Winston (Logging)

---

## 📁 Flujos de Información

### 1. Gestión de Leyes (Híbrido)
- La aplicación almacena solo metadatos (título, expediente, tipo) y el **enlace de Google Drive**.
- Se sincroniza un archivo `leyes.json` con el repositorio de **GitHub Pages**.
- La UI genera un QR que apunta a la URL de GitHub Pages donde se renderiza la lista de leyes con links de descarga.

### 2. Perfiles de Legisladores (JSON + SPA)
- Los datos se exportan a un archivo JSON centralizado en GitHub Pages.
- Una **Single Page Application (SPA)** en GitHub lee estos datos dinámicamente según el ID solicitado.
- Esto evita generar cientos de archivos HTML y facilita las actualizaciones globales de diseño.

### 3. Administración y Acceso
- **Acceso Restringido:** Solo el **Secretario de Cámara** tiene acceso a la aplicación.
- Se ha eliminado la lógica de multi-rol para legisladores para cumplir con las competencias reglamentarias de la Secretaría.
- El sistema de login se simplifica para asegurar que solo la autoridad competente gestione la data oficial.

---

## 🔄 Estado de los Módulos

| Módulo | Estado | Implementación |
| :--- | :--- | :--- |
| **Infraestructura** | ✅ Completado | Drizzle, Migraciones, Logger. |
| **Seguridad IPC** | ✅ Completado | Validación con Zod en handlers. |
| **Auditoría** | ✅ Completado | Hash Chain funcional. |
| **Leyes** | 🔄 Simplificando | Migración a flujo QR + Drive + JSON. |
| **Legisladores** | 🔄 En mejora | Agregando exportación a Subpages. |
| **Sync Engine** | ✅ Funcional | Sincronización con GitHub activa. |

---

## 🚀 Estándares Técnicos
- **No IA:** Se ha descartado el uso de modelos de lenguaje locales para mantener la app ligera.
- **QR First:** El acceso a la información pública se prioriza mediante códigos QR generados dinámicamente.
- **Local-First:** El grueso de la actividad parlamentaria vive en la DB local, sincronizando solo lo necesario para transparencia pública.
