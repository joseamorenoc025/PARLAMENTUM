# 🏛️ Cerebro Legislativo v1.1.0

![GitHub Pages](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-31.0.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**Cerebro Legislativo** es una plataforma de gestión parlamentaria de vanguardia diseñada para Secretarías de Cámara. Combina la potencia de una aplicación de escritorio **Local-First** y una bóveda documental estricta, con la transparencia de un **Portal Ciudadano PWA (Progressive Web App)** dinámico alojado gratuitamente en GitHub Pages.

---

## ✨ Características Estelares

### 🏛️ Gestión Administrativa Centralizada (Desktop App)
*   **Monousuario (Secretaría):** Control total y seguro de la fe pública legislativa sin depender de servidores en la nube.
*   **Bóveda Documental Estricta:** Archivo físico local de documentos PDF y anexos para cada proyecto y ley.
*   **Ciclo de Vida de Proyectos:** Trazabilidad completa por fases (Recepción, Estudio en Comisión, Consulta Pública, Aprobada/Rechazada).
*   **Etiquetas y Búsqueda Semántica:** Clasificación de leyes y proyectos por temas (ej. `#Salud`, `#Seguridad`) y metadatos.
*   **Acuerdos de Cámara:** Registro y control de decisiones plenarias con códigos QR físicos.
*   **Gestión de Legisladores y Junta Directiva:** Control de perfiles institucionales con avatares y jerarquías gestionadas localmente.

### 🌐 Portal Ciudadano PWA (GitHub Pages)
*   **Motor de Sincronización 1-Click:** Sincronización instantánea y cifrada desde el escritorio hacia GitHub Pages, subiendo documentos y bases de datos exportadas en JSON.
*   **Soporte Offline Completo (PWA):** Service worker robusto con estrategia de "Network-First / Fallback a Caché". Los ciudadanos pueden seguir consultando las leyes en sus teléfonos incluso sin internet en áreas remotas o edificios judiciales.
*   **Estadísticas Legislativas (Analytics):** Tablero visual animado y construido en CSS puro con barras responsivas HSL que muestran las leyes aprobadas históricas y el embudo de los proyectos en curso.
*   **Biblioteca Transparente:** Ciudadanos pueden buscar, filtrar por temas y descargar documentos oficiales de las leyes libremente en cualquier fase.
*   **Instalación Nativa:** Diseño instalable ("Añadir a Pantalla de Inicio") en iOS y Android con iconografía institucional.

### 🛡️ Seguridad y Arquitectura
*   **Motor de Sync Seguro (DPAPI):** Tokens de GitHub almacenados con cifrado nativo del Sistema Operativo de Windows (Electron safeStorage).
*   **Fallback Anti-Corrupción:** Los adjuntos binarios (Fotos de legisladores, PDFs de bóveda) se manejan como archivos físicos estáticos independientes de SQLite, garantizando una BD local ultra-ligera y blindada contra corrupción.
*   **Sanador de Esquemas Integrado:** Un validador automático de base de datos (`migrate.js`) reconcilia cualquier esquema viejo de SQLite agregando las columnas necesarias al vuelo al abrir la app, eliminando fricciones al actualizar de versión.

---

## 🛠️ Stack Tecnológico Premium

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Arquitectura** | Electron + React | Experiencia de escritorio fluida, robusta y completamente funcional sin internet. |
| **Persistencia** | SQLite + Drizzle | Datos locales seguros y rápidos con migraciones al vuelo. |
| **Estilos** | TailwindCSS + CSS Puro | Diseño responsive, colores HSL dinámicos, animaciones fluidas y elegantes. |
| **Portal Ciudadano** | Vanilla JS + PWA | Rendimiento extremo, sin dependencias pesadas, carga instantánea, SEO-ready y caché Offline. |

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
*Transformando la gestión legislativa con transparencia inquebrantable y elegancia tecnológica.*
