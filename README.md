# 🧠 Segundo Cerebro Legislativo

[![Electron](https://img.shields.io/badge/Electron-30.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)

Sistema integral de gestión, auditoría y seguimiento para cuerpos legislativos municipales y regionales. Diseñado para centralizar la actividad parlamentaria, garantizar la transparencia y asegurar la integridad de la información mediante tecnologías de vanguardia.

---

## 🚀 Características Principales

### 🔐 Seguridad y Autenticación
*   **RBAC (Control de Acceso Basado en Roles):** Roles diferenciados (Admin, Secretario, Legislador, Viewer) con permisos granulares.
*   **Auditoría Inmutable (Hash Chain):** Registro detallado de cada acción, encadenado mediante firmas digitales (SHA-256) para prevenir manipulaciones.
*   **Validación Estricta:** Comunicación entre procesos (IPC) validada mediante **Zod** para prevenir inyecciones.

### 🏛️ Gestión Legislativa Inteligente
*   **Dashboard en Tiempo Real:** Métricas clave, sesiones activas y semáforo de estancamiento de proyectos.
*   **Agenda Kanban:** Seguimiento visual por fases de proyectos de ley con versionado automático (Snapshots).
*   **Control de Sesiones y Oficios:** Numeración correlativa automatizada y vinculación bidireccional de documentos.
*   **Directorio Legislativo:** Gestión de comisiones, junta directiva y soporte para Miembros Ciudadanos (M-III).

### 🔄 Motor de Sincronización (Sync Engine)
*   **GitHub Sync:** Sincronización bidireccional de la base de datos y documentos con repositorios privados.
*   **Backup Híbrido:** Copias de seguridad locales automáticas e integración planificada con Google Drive.
*   **Gestión de Conflictos:** Sistema de colas (`SyncQueue`) para garantizar la integridad de los datos durante la sincronización.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Runtime** | [Electron 30](https://www.electronjs.org/) |
| **Frontend** | [React 18](https://react.dev/) + [TailwindCSS](https://tailwindcss.com/) |
| **Base de Datos** | [SQLite](https://sqlite.org/) (via `better-sqlite3`) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) |
| **Testing** | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) |
| **Seguridad** | `bcryptjs` + `crypto-js` + `Zod` |

---

## 📁 Estructura del Proyecto

```text
/
├── electron/             # Proceso Principal (Backend / OS)
│   ├── main.js           # Punto de entrada de Electron
│   ├── preload.cjs       # Puente seguro (Context Isolation)
│   └── src/
│       ├── db/           # Capa de Datos (Drizzle Schema & Migrations)
│       ├── ipc/          # Handlers y Esquemas de Validación (Zod)
│       └── modules/      # Lógica de Negocio (Sync Engine, Auth)
├── src/                  # Proceso de Renderizado (Frontend / UI)
│   ├── components/       # Módulos React (Agenda, Vault, Dashboard)
│   ├── services/         # Comunicación IPC con el Proceso Principal
│   └── hooks/            # Hooks personalizados (useLegisData)
└── docs/                 # Documentación técnica y Roadmap
```

---

## 📦 Instalación y Desarrollo

1.  **Requisitos:** Node.js (v18+) y npm.
2.  **Clonar y Configurar:**
    ```bash
    git clone https://github.com/tu-usuario/cerebro-legislativo.git
    cd cerebro-legislativo
    cp .env.example .env
    ```
3.  **Instalar dependencias:**
    ```bash
    npm install
    ```
4.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

### 🛠️ Comandos Útiles
*   `npm run build:win`: Genera el instalador para Windows (.exe).
*   `npm run db:migrate`: Genera y aplica migraciones de base de datos.
*   `npm test`: Ejecuta la suite de pruebas con Vitest.
*   `npm run lint`: Ejecuta el análisis estático de código.

---

## 📜 Licencia y Uso
Este proyecto es propiedad privada y está diseñado para uso institucional. Todos los derechos reservados.

---
*Desarrollado con integridad para el fortalecimiento de la institucionalidad legislativa.*
