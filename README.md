# 🏛️ PARLAMENTUM

![GitHub Pages](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**PARLAMENTUM** (anteriormente Cerebro Legislativo) es una plataforma de gestión parlamentaria de vanguardia diseñada para Secretarías de Cámara. Combina la potencia de una aplicación de escritorio **Local-First** y una bóveda documental estricta, con la transparencia de un **Portal Ciudadano PWA (Progressive Web App)** dinámico alojado gratuitamente en GitHub Pages.

---

## ✨ Características Estelares

### 🏛️ Gestión Administrativa Centralizada (Desktop App)
*   **Monousuario (Secretaría):** Control total y seguro de la fe pública legislativa sin depender de servidores en la nube.
*   **Bóveda Documental Estricta:** Archivo físico local de documentos PDF y anexos para cada proyecto y ley.
*   **Ciclo de Vida de Proyectos:** Trazabilidad completa por fases (Recepción, Estudio en Comisión, Consulta Pública, 2da Discusión, 3ra Discusión, Aprobada/Promulgada).
*   **Sincronización UX en Tiempo Real:** Interfaz reactiva que refresca de forma instantánea el estado de los PDF vinculados a la Bóveda en los módulos de **Agenda, Oficios y Acuerdos**.
*   **Etiquetas y Búsqueda Semántica:** Clasificación de leyes y proyectos por temas (ej. `#Salud`, `#Seguridad`) y metadatos.
*   **Acuerdos de Cámara y Estampado PDF:** Registro y control de decisiones plenarias con códigos QR físicos y estampado sobre el PDF para validación de autenticidad.
*   **Gestión de Legisladores y Junta Directiva:** Control de perfiles institucionales con avatares y jerarquías gestionadas localmente.

### 🌐 Portal Ciudadano PWA (GitHub Pages)
*   **Despliegue Automatizado (CI/CD):** Las actualizaciones del portal y los metadatos se despliegan automáticamente a través de **GitHub Actions**, garantizando consistencia y eliminando errores de sincronización manual (403/404).
*   **Soporte Offline Completo (PWA):** Service worker robusto con estrategia de "Network-First / Fallback a Caché". Los ciudadanos pueden seguir consultando las leyes en sus teléfonos incluso sin internet en áreas remotas o edificios judiciales.
*   **Estadísticas Legislativas (Analytics):** Tablero visual animado y construido en CSS puro con barras responsivas HSL que muestran las leyes aprobadas históricas y el embudo de los proyectos en curso.
*   **Biblioteca Transparente multi-fase:** Ciudadanos pueden buscar, filtrar por temas y descargar documentos oficiales de las leyes libremente en cualquier fase de su ciclo de vida.
*   **Contadores de Descarga & Popularidad:** Badge visual tipo *pill* reactivo que mide e incrementa el interés público, además de un ranking del "Top 3" de proyectos y leyes más consultadas.
*   **Seguridad Web Anti-XSS:** El portal implementa un escape riguroso de strings y sanitización del DOM para prevenir vulnerabilidades de inyección y Cross-Site Scripting.

### 🛡️ Seguridad y Arquitectura
*   **Motor de Sync Seguro (DPAPI):** Tokens de GitHub almacenados con cifrado nativo del Sistema Operativo de Windows (Electron safeStorage).
*   **Autenticación y Recuperación Avanzada (BIP39):** Sistema de login robusto con frase de recuperación de 12 palabras exportable a PDF, eliminando preguntas de seguridad vulnerables.
*   **Fallback Anti-Corrupción:** Los adjuntos binarios (Fotos de legisladores, PDFs de bóveda) se manejan como archivos físicos estáticos independientes de SQLite, garantizando una BD local ultra-ligera y blindada contra corrupción.
*   **Sanador de Esquemas Integrado:** Un validador automático de base de datos (`migrate.js`) reconcilia cualquier esquema viejo de SQLite agregando las columnas necesarias al vuelo al abrir la app.

---

## 💻 Estructura del Proyecto

El código está organizado de manera modular bajo los principios de separación de responsabilidades:
```text
├── electron/                 # Proceso Principal (Backend de la App de Escritorio)
│   ├── src/
│   │   ├── db/               # Esquemas, Migraciones SQLite y Drizzle ORM
│   │   ├── ipc/              # Handlers de comunicación entre React y el Proceso Principal (IPC)
│   │   └── modules/          # Motores nativos (Generación de PDF, Estampado QR, Sincronizador)
│   └── main.js               # Punto de entrada de Electron
├── src/                      # Proceso de Renderizado (Frontend de la App - React)
│   ├── components/           # Módulos principales (Agenda, Acuerdos, Oficios, Legisladores)
│   ├── hooks/                # Hooks de control del estado global de la base de datos (useLegisData)
│   └── App.jsx               # Punto de entrada de React
├── portal/                   # Portal Ciudadano Web (Estático y Serverless para GitHub Pages)
│   └── index.html            # PWA de Consulta Ciudadana
├── .github/workflows/        # Flujos de CI/CD para GitHub Pages automatizado
├── test/                     # Suite de Pruebas Automatizadas
│   ├── integration/          # Pruebas de integración de la base de datos e IPC
│   └── e2e/                  # Pruebas extremo a extremo de Electron + React (Playwright)
```

---

## 🗃️ Ubicación de Datos y Estrategia de Respaldos (Backups)

Al tratarse de una aplicación **Local-First**, toda la información se almacena localmente en la máquina de la Secretaría de la Cámara. El directorio base varía según el sistema operativo, pero en Windows se ubica en:

📂 **Ruta Base (AppData):**
```text
C:\Users\<TuUsuario>\AppData\Roaming\PARLAMENTUM\
```

### Contenido del Directorio:
1.  **`db.sqlite`**: La base de datos SQLite con toda la información.
2.  **`boveda/`**: Carpeta que contiene todos los archivos PDF organizados físicamente y vinculados.
3.  **`fotos_legisladores/`**: Carpeta local donde se almacenan las fotos cargadas.

> [!WARNING]
> **Estrategia de Respaldo Manual:** Para realizar una copia de seguridad 100% segura del sistema, solo debes copiar la carpeta `PARLAMENTUM` de tu directorio AppData a un medio de almacenamiento externo (Disco Duro, Google Drive, OneDrive).

---

## 🚀 Puesta en Marcha Inicial (Onboarding)

Cuando instalas e inicias **PARLAMENTUM** en un equipo completamente nuevo, el asistente inteligente te guiará en:
1.  **Registro del Administrador:** Definir contraseña maestra de seguridad.
2.  **Frase de Recuperación (BIP39):** Se generará una frase única de **12 palabras de recuperación** (exportable a PDF de seguridad).
3.  **Datos Institucionales:** Define el nombre de la cámara y el período legislativo actual.

---

## 📦 Compilación y Creación de Entregables (Releases)

### 1. Compilar para Windows (`.exe`):
Para generar el instalador interactivo (`NSIS`) y la versión portable autónoma:
```bash
npm run build:win
```
Los archivos de salida se guardarán en la carpeta `dist/`.

### 2. Publicación Automatizada en GitHub Releases:
Si dispones de un token de acceso personal (PAT) de GitHub, puedes compilar y subir los entregables automáticamente:
```powershell
# En PowerShell:
$env:GH_TOKEN="tu_personal_access_token_de_github"
npx electron-builder --win -p always
```

---

## 💻 Instalación para Desarrolladores

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/joseamorenoc025/parlamentum.git
    ```
2.  **Instalar dependencias y módulos nativos:**
    ```bash
    npm install
    npm run postinstall
    ```
3.  **Correr en modo desarrollo:**
    ```bash
    npm run dev
    ```

### Running Tests:
*   **Pruebas unitarias e integración (Vitest):** `npm run test`
*   **Pruebas E2E (Playwright):** `npm run test:e2e`

---

## 📚 Documentación Adicional

Para más detalles, por favor consulta los siguientes documentos:
*   📜 **[Historial de Cambios (Changelog)](CHANGELOG.md):** Todas las características, arreglos y actualizaciones por versión.
*   🏗️ **[Arquitectura (Architecture)](ARCHITECTURE.md):** Detalles sobre el diseño Local-First, motor de sincronización y mitigaciones de seguridad.
*   🤝 **[Guía de Contribución (Contributing)](CONTRIBUTING.md):** Cómo preparar el entorno y enviar Pull Requests.
*   🛡️ **[Política de Seguridad (Security)](SECURITY.md):** Reporte de vulnerabilidades y esquemas de cifrado.

---
*Transformando la gestión legislativa con transparencia inquebrantable, seguridad local y elegancia tecnológica.*
