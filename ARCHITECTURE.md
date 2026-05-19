# Arquitectura de PARLAMENTUM

Este documento describe las decisiones de diseño arquitectónico de PARLAMENTUM.

## 1. El Paradigma Local-First

La aplicación está diseñada para ser la "fuente única de la verdad" de forma **completamente desconectada de internet**.
*   **Base de datos:** Se utiliza SQLite (con Drizzle ORM) que reside exclusivamente en el almacenamiento local del equipo (`%AppData%\PARLAMENTUM\db.sqlite`).
*   **Archivos Físicos:** Los archivos PDF (Bóveda Documental) y las fotografías no se guardan en Blob dentro de la base de datos, sino como archivos físicos en disco. Esto previene la corrupción de la BD y permite un backup sencillo.

## 2. Motor de Sincronización (Sync)

En lugar de requerir un servidor dedicado en la nube (AWS/Azure), utilizamos **GitHub Pages** como un Content Delivery Network gratuito y seguro para publicar datos estáticos.

1.  **Exportación:** Electron lee la base de datos SQLite y exporta todas las entidades públicas a archivos `.json` (ej. `leyes.json`, `metadata.json`).
2.  **Commit API:** Mediante llamadas a la API REST de GitHub (usando un Personal Access Token cifrado), Electron sube estos archivos JSON junto con los nuevos PDFs de la bóveda a un repositorio de GitHub.
3.  **GitHub Actions:** El push a GitHub dispara un Workflow (`deploy.yml`) que compila la PWA del Portal Ciudadano y la expone públicamente.

## 3. Seguridad y Almacenamiento

*   **Electron safeStorage:** Las credenciales de sincronización (GitHub Token) nunca se almacenan en texto plano. Se usa el motor DPAPI de Windows u OS Keychain para cifrar el token localmente, atando la llave a la sesión del usuario del SO.
*   **Contraseñas:** Derivación robusta local.
*   **BIP39:** Las contraseñas pueden restablecerse solo mediante una frase criptográfica de recuperación.

## 4. Frontend Ciudadano (Portal PWA)

El portal es un sitio estático ("Serverless") con Vanilla JavaScript.
*   **Service Worker:** Almacena en caché (CacheStorage) todos los documentos PDF ya visitados y los archivos JSON, asegurando que si un ciudadano pierde la conexión, aún puede leer las leyes.
*   **Sin Dependencias Pesadas:** Se evita usar frameworks gigantescos para garantizar carga casi instantánea incluso en conexiones 3G limitadas.
