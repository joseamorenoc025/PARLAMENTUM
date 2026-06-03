# PARLAMENTUM — Roadmap de Mejoras

## Fase 1: Security Hardening (CRITICAL)
1. Eliminar `legisAPI.invoke` genérico del preload.cjs
2. Bloquear `db:query` — solo SELECT con whitelist de tablas
3. Strip `passwordHash` y `recoveryCodeHash` de `auth:get-user`
4. Agregar `app.requestSingleInstanceLock()` en main.js
5. Agregar CSP headers en BrowserWindow
6. Verificar lint + tests + startup post-cambios

## Fase 2: Structural Fixes (HIGH)
1. Enable `PRAGMA foreign_keys = ON`
2. Agregar Error Boundaries
3. Split `useLegisData` — per-entity hooks o state library
4. Agregar React Router

## Fase 3: UX/UI Polish (MEDIUM) — Requiere reglas del usuario
1. Reemplazar `window.confirm()` con modales estilizados
2. Agregar skeleton loaders
3. Agregar debounce en búsqueda
4. Dark mode: detección de preferencia del sistema
5. Fix mobile sidebar (drawer/hamburger)
6. Unificar política de contraseñas (8 vs 12 chars)

## Fase 4: Code Quality & Branding (LOW)
1. Wire up `parliament.*` color tokens en Tailwind
2. Eliminar dead code (ToastContainer, mergeLaws, securityQuestion, kanbanRef)
3. Eliminar console.log de producción
4. Agregar PropTypes o migrar a TypeScript
5. Aumentar cobertura de tests
