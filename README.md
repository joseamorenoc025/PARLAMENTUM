# 🏛️ Cerebro Legislativo v1.0

![GitHub Pages](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-30.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**Cerebro Legislativo** es una plataforma de gestión parlamentaria de vanguardia diseñada para Secretarías de Cámara. Combina la potencia de una aplicación de escritorio **Local-First** con la transparencia de un portal ciudadano dinámico alojado en **GitHub Pages**.

---

## ✨ Características Estelares

### 🏛️ Gestión Administrativa Centralizada
*   **Monousuario (Secretaría):** Control total y seguro de la fe pública legislativa.
*   **Ciclo de Vida de Proyectos:** Trazabilidad completa (1ra Discusión, Consulta Pública, 2da Discusión, Aprobada) con vinculación a respaldos en la nube.
*   **Acuerdos de Cámara:** Registro y control de decisiones plenarias, vinculadas a sesiones y con códigos QR de acceso.
*   **Gestión de Legisladores:** Control completo de perfiles y comisiones listo para exportación.

### 🌐 Ecosistema Local y Nube Integrado
*   **Gestión Documental Híbrida:** Integra tus enlaces de Google Drive directamente en el sistema para leyes, acuerdos y proyectos.
*   **Generación de QR Nativo:** Generación instantánea de códigos QR para facilitar la impresión y acceso físico a los documentos digitales.
*   **Modo Oscuro/Claro Inteligente:** Toda la plataforma se adapta a las preferencias visuales del usuario para reducir la fatiga visual.

### 🛡️ Seguridad y Calidad (Enterprise-Ready)
*   **Auditoría de Integridad (Anti-Ghosting):** Implementación de sellos criptográficos (SHA-256) para garantizar que los documentos PDF no han sido alterados.
*   **Pruebas Automatizadas (E2E):** Suite de validación exhaustiva utilizando **Playwright** para garantizar estabilidad tras cada actualización.

---

## 🛠️ Stack Tecnológico Premium

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Arquitectura** | Electron + React | Experiencia de escritorio fluida y moderna. |
| **Persistencia** | SQLite + Drizzle | Datos locales seguros con migraciones robustas. |
| **Estilos** | TailwindCSS + UI Components | Diseño responsive, elegante y consistente. |
| **Aseguramiento (QA)** | Playwright | Pruebas End-to-End automatizadas. |

---

## 🚀 Próximamente (Roadmap)
- [ ] **Reportes 2.0 Avanzados**: Generación de informes de gestión con logo institucional y Acuerdos de Cámara.
- [ ] **Portal Ciudadano Interactivo**: Filtros avanzados por legislador para el portal público.
- [ ] **CI/CD con GitHub Actions**: Generación automática de instaladores `.exe`.

---

## 💻 Instalación para Desarrolladores

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/joseamorenoc025/cerebro_legislativo.git
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```
3.  **Modo Desarrollo:**
    ```bash
    npm run dev
    ```

---
*Transformando la gestión legislativa con transparencia y elegancia tecnológica.*
