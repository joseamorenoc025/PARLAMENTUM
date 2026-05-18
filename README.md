# 🏛️ Cerebro Legislativo

![GitHub Pages](https://img.shields.io/badge/Status-Stable-success?style=for-the-badge)
![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

**Cerebro Legislativo** es una plataforma de gestión parlamentaria de vanguardia diseñada para Secretarías de Cámara. Combina la potencia de una aplicación de escritorio **Local-First** y una bóveda documental estricta, con la transparencia de un **Portal Ciudadano PWA (Progressive Web App)** dinámico alojado gratuitamente en GitHub Pages.

---

## ✨ Características Estelares

### 🏛️ Gestión Administrativa Centralizada (Desktop App)
*   **Monousuario (Secretaría):** Control total y seguro de la fe pública legislativa sin depender de servidores en la nube.
*   **Bóveda Documental Estricta:** Archivo físico local de documentos PDF y anexos para cada proyecto y ley.
*   **Ciclo de Vida de Proyectos:** Trazabilidad completa por fases (Recepción, Estudio en Comisión, Consulta Pública, 2da Discusión, 3ra Discusión, Aprobada/Promulgada).
*   **Sincronización UX en Tiempo Real:** Interfaz reactiva que refresca de forma instantánea el estado de los PDF vinculados a la Bóveda en los módulos de **Agenda, Oficios y Acuerdos**.
*   **Etiquetas y Búsqueda Semántica:** Clasificación de leyes y proyectos por temas (ej. `#Salud`, `#Seguridad`) y metadatos.
*   **Acuerdos de Cámara:** Registro y control de decisiones plenarias con códigos QR físicos y estampado sobre el PDF.
*   **Gestión de Legisladores y Junta Directiva:** Control de perfiles institucionales con avatares y jerarquías gestionadas localmente.

### 🌐 Portal Ciudadano PWA (GitHub Pages)
*   **Motor de Sincronización 1-Click:** Sincronización instantánea y cifrada desde el escritorio hacia GitHub Pages, subiendo documentos y bases de datos exportadas en JSON.
*   **Soporte Offline Completo (PWA):** Service worker robusto con estrategia de "Network-First / Fallback a Caché". Los ciudadanos pueden seguir consultando las leyes en sus teléfonos incluso sin internet en áreas remotas o edificios judiciales.
*   **Estadísticas Legislativas (Analytics):** Tablero visual animado y construido en CSS puro con barras responsivas HSL que muestran las leyes aprobadas históricas y el embudo de los proyectos en curso.
*   **Biblioteca Transparente:** Ciudadanos pueden buscar, filtrar por temas y descargar documentos oficiales de las leyes libremente en cualquier fase.
*   **Contadores de Descarga:** Badge visual tipo *pill* reactivo que mide e incrementa el interés público mediante el uso estratégico de almacenamiento local (`localStorage`).
*   **Instalación Nativa:** Diseño instalable ("Añadir a Pantalla de Inicio") en iOS y Android con iconografía institucional.

### 🛡️ Seguridad y Arquitectura
*   **Motor de Sync Seguro (DPAPI):** Tokens de GitHub almacenados con cifrado nativo del Sistema Operativo de Windows (Electron safeStorage).
*   **Fallback Anti-Corrupción:** Los adjuntos binarios (Fotos de legisladores, PDFs de bóveda) se manejan como archivos físicos estáticos independientes de SQLite, garantizando una BD local ultra-ligera y blindada contra corrupción.
*   **Sanador de Esquemas Integrado:** Un validador automático de base de datos (`migrate.js`) reconcilia cualquier esquema viejo de SQLite agregando las columnas necesarias al vuelo al abrir la app, eliminando fricciones al actualizar de versión.

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
├── test/                     # Suite de Pruebas Automatizadas
│   ├── integration/          # Pruebas de integración de la base de datos e IPC
│   └── e2e/                  # Pruebas extremo a extremo de Electron + React (Playwright)
```

---

## 🛠️ Stack Tecnológico Premium

| Componente | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Arquitectura** | Electron + React | Experiencia de escritorio fluida, robusta y completamente funcional sin internet. |
| **Persistencia** | SQLite + Drizzle ORM | Datos locales seguros y rápidos con migraciones al vuelo. |
| **Estilos** | TailwindCSS + CSS Puro | Diseño responsive, colores HSL dinámicos, animaciones fluidas y elegantes. |
| **Portal Ciudadano**| Vanilla JS + PWA | Rendimiento extremo, sin dependencias pesadas, carga instantánea, SEO-ready y caché Offline. |
| **Pruebas** | Vitest + Playwright | Cobertura robusta de calidad unitaria, integración y flujos de interfaz nativa. |

---

## 🗃️ Ubicación de Datos y Estrategia de Respaldos (Backups)

Al tratarse de una aplicación **Local-First**, toda la información se almacena localmente en la máquina de la Secretaría de la Cámara. El directorio base varía según el sistema operativo, pero en Windows se ubica en:

📂 **Ruta Base (AppData):**
```text
C:\Users\<TuUsuario>\AppData\Roaming\Cerebro Legislativo\
```

### Contenido del Directorio:
1.  **`db.sqlite`**: La base de datos SQLite con toda la información de leyes, proyectos, legisladores, oficios y bitácoras de auditoría.
2.  **`boveda/`**: Carpeta que contiene todos los archivos PDF organizados físicamente y vinculados a los módulos.
3.  **`fotos_legisladores/`**: Carpeta local donde se almacenan las fotos cargadas de la junta directiva y legisladores.

> [!WARNING]
> **Estrategia de Respaldo Manual:** Para realizar una copia de seguridad 100% segura del sistema, solo debes copiar la carpeta `Cerebro Legislativo` de tu directorio AppData a un medio de almacenamiento externo (Disco Duro, Google Drive, OneDrive). Si deseas restaurarlo o migrar de PC, instala la app en el nuevo equipo y pega la carpeta en el mismo directorio antes de abrirla.

---

## 🚀 Puesta en Marcha Inicial (Onboarding)

Cuando instalas e inicias **Cerebro Legislativo** en un equipo completamente nuevo, el asistente inteligente (Onboarding Wizard) te guiará en los siguientes pasos:
1.  **Registro del Administrador:** Se solicita definir la contraseña maestra de seguridad. El sistema requiere políticas de contraseña seguras (mínimo 8 caracteres, números y símbolos).
2.  **Frase de Recuperación (BIP39):** Se generará una frase única de **12 palabras de recuperación**. Esta frase es el único método para restablecer la contraseña maestra en caso de olvido. **Debes exportarla a PDF o anotarla físicamente en un lugar seguro.**
3.  **Datos Institucionales:** Define el nombre de la cámara (ej. *Cámara Legislativa del Estado*), el nombre del secretario a cargo del registro y el período legislativo actual.

---

## 📦 Compilación y Creación de Entregables (Releases)

La aplicación viene configurada con `electron-builder` para empaquetar de forma automatizada tanto instaladores clásicos como ejecutables portables.

### Requisitos Previos:
Asegúrate de instalar los módulos nativos en caso de ser necesario:
```bash
npm run postinstall
```

### 1. Compilar para Windows (`.exe`):
Para generar el instalador interactivo (`NSIS`) y la versión portable autónoma:
```bash
npm run build:win
```
Los archivos de salida se guardarán en la carpeta `dist/` en la raíz del proyecto. El archivo principal de distribución será:
*   📦 **`Cerebro Legislativo-1.0.0-win.exe`** (Instalador listo para entregar al usuario).

### 2. Publicación Automatizada en GitHub Releases:
Si dispones de un token de acceso personal (PAT) de GitHub, puedes compilar y subir los entregables automáticamente como borrador de Release en un solo comando:
```powershell
# En PowerShell:
$env:GH_TOKEN="tu_personal_access_token_de_github"
npx electron-builder --win -p always
```

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
3.  **Correr en modo desarrollo:**
    ```bash
    npm run dev
    ```

### Running Tests:
*   **Pruebas unitarias e integración (Vitest):**
    ```bash
    npm run test
    ```
*   **Pruebas Extremo a Extremo de la UI (Playwright + Electron):**
    ```bash
    npm run test:e2e
    ```

---
*Transformando la gestión legislativa con transparencia inquebrantable, seguridad local y elegancia tecnológica.*
