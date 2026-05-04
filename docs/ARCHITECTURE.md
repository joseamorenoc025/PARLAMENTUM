# Arquitectura: Segundo Cerebro Legislativo

Este documento describe la estructura, patrones y estándares técnicos del software para garantizar su escalabilidad y mantenibilidad.

## 🏗️ Stack Tecnológico

- **Runtime:** [Electron 30](https://www.electronjs.org/)
- **Frontend:** [React 18](https://react.dev/) + [TailwindCSS](https://tailwindcss.com/)
- **Base de Datos:** [SQLite](https://sqlite.org/) (vía `better-sqlite3`)
- **ORM & Migraciones:** [Drizzle ORM](https://orm.drizzle.team/)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Logging:** [Winston](https://github.com/winstonjs/winston)

---

## 📁 Estructura del Proyecto

```text
/
├── .github/workflows/    # CI/CD (GitHub Actions)
├── electron/             # Proceso Principal (Backend/OS)
│   ├── main.js           # Punto de entrada de Electron
│   ├── preload.cjs       # Puente seguro (Context Isolation)
│   └── src/
│       ├── db/           # Capa de Datos (Esquemas y Migraciones)
│       └── lib/          # Utilidades del Proceso Principal (Logger, etc.)
├── src/                  # Proceso de Renderizado (Frontend/UI)
│   ├── components/       # Componentes React (UI y Módulos)
│   ├── hooks/            # Lógica compartida de React
│   ├── services/         # Comunicación con Electron (IPC)
│   ├── utils/            # Funciones puras y helpers
│   └── test/             # Configuración de tests
└── legis.db              # Base de datos local (SQLite)
```

---

## 🛠️ Patrones y Estándares

### 1. Gestión de Base de Datos (Drizzle)
Hemos migrado de SQL manual a **Drizzle ORM**. 
- **Esquema:** Definido en `electron/src/db/schema.js`.
- **Migraciones:** Se generan con `npx drizzle-kit generate` y se aplican automáticamente al iniciar la app mediante `electron/src/db/migrate.js`.
- **Acceso:** Se debe preferir el uso de `db` (Drizzle) sobre `sqlite` (Raw) para nuevas funcionalidades.

### 2. Comunicación IPC (Inter-Process Communication)
El frontend **nunca** accede a la DB directamente.
- El Proceso Principal expone handlers vía `ipcMain.handle`.
- El Frontend utiliza `window.electron` (definido en `preload.cjs`) para invocar estos handlers.

### 3. Estrategia de Testing (TDD)
Seguimos una mentalidad de **Test-Driven Development**:
- **Unitarios:** Pruebas de lógica pura en `src/utils/__tests__`.
- **Componentes:** Pruebas de UI en `src/components/.../__tests__`.
- **Comando:** `npm test` para ejecutar todas las pruebas.

### 4. Observabilidad
- Los errores no se muestran solo en consola; se registran en `%AppData%/cerebro-legislativo/logs/`.
- Uso de `logger.info`, `logger.error` para trazabilidad en producción.

---

## 🔄 Estado de Migración a Drizzle

Actualmente el sistema se encuentra en una fase híbrida. El objetivo es eliminar `db:query` (SQL crudo) en favor de handlers específicos tipados.

| Módulo | Estado | Notas |
| :--- | :--- | :--- |
| **Infraestructura Base** | ✅ Completado | Configuración de Drizzle, Migraciones y Logger. |
| **Estadísticas (Stats)** | ✅ Completado | Migrado a Drizzle (`db:get-stats`). |
| **Usuarios/Auth** | ✅ Completado | Migrado vía `auth:get-user` y `db:upsert`. |
| **Legisladores & Comisiones** | ✅ Completado | Migrado vía `db:select` y `db:upsert`. |
| **Sesiones & Oficios** | ✅ Completado | Migrado vía `db:select` y `db:upsert`. |
| **Proyectos & Versiones** | ✅ Completado | Migrado (Snapshot maneja JSON automáticamente). |
| **Auditoría & Logs** | ✅ Completado | Migrado a `db:select` y `db:upsert`. |
| **Leyes (Biblioteca)** | ⏳ Pendiente | Pendiente integrar selector PDF y Drive. |

---

## 🚀 Guía para Desarrolladores

### Agregar una nueva tabla:
1. Definir la tabla en `electron/src/db/schema.js`.
2. Ejecutar `npm.cmd run drizzle-kit generate` (en Windows) para crear la migración.
3. El sistema aplicará el cambio al siguiente reinicio.

### Crear un nuevo Componente:
1. Crear el componente en `src/components/ui`.
2. Crear su test en `__tests__` siguiendo el flujo TDD (Falla -> Implementa -> Pasa).

### CI/CD:
Cada Push/PR a `main` dispara:
- Linting de código.
- Ejecución de tests unitarios y de componentes.
- Empaquetado automático para Windows, Mac y Linux (Artifacts).
