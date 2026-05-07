# 🧠 Segundo Cerebro Legislativo

[![Electron](https://img.shields.io/badge/Electron-30.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

Sistema integral de gestión y seguimiento para cuerpos legislativos. Diseñado para ser ligero, transparente y eficiente, integrando el trabajo de oficina con la visibilidad pública mediante códigos QR y GitHub Pages.

---

## 🚀 Características Principales

### 🏛️ Gestión Legislativa Operativa
*   **Secretaría de Cámara (Admin):** Gestión centralizada por parte del Secretario de Cámara.
*   **Agenda Legislativa:** Seguimiento tipo Kanban de proyectos con snapshots de versiones.
*   **Sesiones y Oficios:** Numeración correlativa automatizada y vinculación de documentos.
*   **Directorio de Legisladores:** Gestión completa de comisiones y perfiles.

### 📚 Biblioteca de Leyes "Light"
*   **Integración Drive + QR:** Carga de leyes mediante enlaces de Google Drive.
*   **Publicación en GitHub Pages:** Sincronización de metadatos JSON para visualización web.
*   **Acceso Universal:** Generación de códigos QR para descarga inmediata de leyes desde cualquier dispositivo móvil.

### 👤 Conoce a tu Legislador
*   **Perfiles Públicos:** Generación automática de subpáginas en GitHub con biografía, partido y comisiones.
*   **QR Legislador:** Cada legislador cuenta con un QR que lleva directamente a su perfil público actualizado.

### 🔐 Seguridad y Transparencia
*   **Auditoría Inmutable:** Registro de acciones con Hash Chain para prevenir manipulaciones.
*   **Validación IPC (Zod):** Comunicación segura entre procesos para proteger la integridad del sistema.
*   **Privacidad:** Los datos sensibles permanecen locales o en repositorios privados.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Runtime** | Electron 30 |
| **Frontend** | React 18 + TailwindCSS |
| **Base de Datos** | SQLite (via Drizzle ORM) |
| **Publicación** | GitHub Pages (JSON/Web) |
| **Seguridad** | Zod + SHA-256 (Audit Logs) |

---

## 📦 Instalación y Desarrollo

1.  **Clonar y configurar:**
    ```bash
    git clone https://github.com/tu-usuario/cerebro-legislativo.git
    cd cerebro-legislativo
    npm install
    ```
2.  **Ejecutar:**
    ```bash
    npm run dev
    ```

---
*Fortaleciendo la institucionalidad legislativa mediante la tecnología y la transparencia.*
