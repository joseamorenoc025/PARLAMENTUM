# Guía de Contribución

¡Gracias por tu interés en contribuir a PARLAMENTUM!

## 1. Entorno de Desarrollo

1. Clona el repositorio y usa la versión de Node LTS actual.
2. Instala las dependencias: `npm install`.
3. Instala dependencias nativas para SQLite: `npm run postinstall`.
4. Inicia el modo desarrollo: `npm run dev` (Iniciará tanto el proceso de Vite para React como el proceso principal de Electron).

## 2. Base de Datos y Drizzle ORM

Si necesitas modificar la estructura de la base de datos:
1. Edita los esquemas en `electron/src/db/schema.js`.
2. Ejecuta la generación de migraciones: `npm run db:generate`.
3. El archivo `migrate.js` se encargará de aplicar los cambios en la próxima ejecución de la app automáticamente.

## 3. Convenciones de Código

*   **Frontend (React):** Usa Tailwind CSS para el estilo principal de la app de escritorio. Mantén los componentes funcionales y usa hooks para estado complejo.
*   **Portal (Vanilla JS):** El código en `portal/` no debe tener dependencias de NPM en ejecución. Usa JavaScript moderno y asegúrate de evitar `innerHTML` a favor de `textContent` o `createElement` para prevenir XSS.
*   **Rutas Absolutas:** Al manejar archivos en el backend (Electron), usa siempre el módulo `path` de Node.js en conjunto con `app.getPath('userData')`.

## 4. Pruebas Automatizadas

No se aceptarán Pull Requests (PRs) si no pasan todas las pruebas.
*   **Pruebas Unitarias:** Ejecuta `npm run test`.
*   **Pruebas E2E (Playwright):** Ejecuta `npm run test:e2e`. Asegúrate de no romper flujos críticos como el Onboarding, Sincronización o Creación de Proyectos.
