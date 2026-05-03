# 🧠 Segundo Cerebro Legislativo

Sistema integral de gestión, auditoría y seguimiento para cuerpos legislativos municipales y regionales. Diseñado para centralizar la actividad parlamentaria, garantizar la transparencia y asegurar la integridad de la información.

## 🚀 Características Principales

### 🔐 Seguridad y Autenticación
*   **RBAC (Control de Acceso Basado en Roles):** Roles diferenciados para Administradores, Secretarios y Legisladores.
*   **Encriptación Institucional:** Hashing de contraseñas mediante `bcryptjs` y protección de rutas.
*   **Auditoría Inmutable (Hash Chain):** Registro detallado de cada acción del sistema, encadenado mediante firmas digitales para prevenir manipulaciones manuales en la base de datos.

### 🏛️ Gestión Legislativa
*   **Dashboard Inteligente:** Resumen en tiempo real de sesiones, oficios y proyectos activos.
*   **Agenda Legislativa:** Seguimiento visual por fases de proyectos de ley (desde Comisión hasta Sanción).
*   **Control de Sesiones:** Registro de sesiones ordinarias, extraordinarias y especiales con numeración correlativa automática.
*   **Oficios Salientes:** Gestión y vinculación de comunicaciones oficiales con sesiones parlamentarias.
*   **Legisladores y Comisiones:** Directorio completo y organización de la junta directiva de cada comisión.

### 📁 Gestión Documental y Backups
*   **Bóveda Documental:** Almacenamiento seguro de archivos PDF y Word vinculados a entidades legislativas.
*   **Biblioteca de Leyes con QR:** Generación de códigos QR únicos para consulta pública de leyes sancionadas.
*   **Sistema de Backup Híbrido:** Copias de seguridad locales automáticas y preparación para integración con Google Drive.

## 🛠️ Stack Tecnológico
*   **Frontend:** React 18, TailwindCSS, Lucide Icons.
*   **Runtime:** Electron 30 (Aplicación de escritorio nativa).
*   **Base de Datos:** SQLite (better-sqlite3) para persistencia local rápida y segura.
*   **Seguridad:** Bcryptjs para hashing y SHA-256 para integridad de logs.

## 📦 Instalación y Desarrollo

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/cerebro-legislativo.git
    cd cerebro-legislativo
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Ejecutar en modo desarrollo:**
    ```bash
    npm run dev
    ```

4.  **Generar ejecutable (Windows):**
    ```bash
    npm run build:win
    ```

## 📜 Licencia
Este proyecto es propiedad privada y está diseñado para uso institucional. Todos los derechos reservados.

---
*Desarrollado con ❤️ para el fortalecimiento de la institucionalidad legislativa.*
