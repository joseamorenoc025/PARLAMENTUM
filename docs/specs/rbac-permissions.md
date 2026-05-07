Propósito: Especificación técnica y de arquitectura para el Control de Acceso Basado en Roles (RBAC) con permisos atómicos en cerebro_legislativo.
Stack objetivo: Electron (main) + React (renderer) + Drizzle/SQLite + Zod + IPC + shadcn/ui.
Principio rector: "El backend verifica, el frontend optimiza". Ninguna acción se ejecuta sin validación en el proceso principal.
Última actualización: 2026-05-07
🎯 Objetivo General
Implementar un sistema de autorización granular, seguro y de bajo mantenimiento.
Sustituir la lógica de "roles fijos" por permisos atómicos asignados a roles predefinidos.
Garantizar que cada llamada IPC valide el permiso antes de ejecutar cualquier operación sensible.
Ofrecer componentes frontend declarativos que oculten/muestren UI según permisos sin repetir lógica.
Registrar cambios de rol y accesos denegados en el módulo de auditoría.
🏗️ Arquitectura de Autorización (Flujo)
[Renderer] → Acción de usuario (clic, submit, navegación)
     ↓
[Frontend Guard] → <Can permission="CAN_CREATE_SESSION"> o <ProtectedRoute>
     ↓ (si pasa)
[IPC Request] → `ipcRenderer.invoke('session:create', payload)`
     ↓
[Main Process] → Middleware `requirePermission('CAN_CREATE_SESSION')`
     ↓
[Validación] → Verifica sesión activa + permisos cacheados en memoria
     ↓ (si OK)
[Ejecución] → Handler procesa → Respuesta a renderer
     ↓ (si DENIED)
[Rechazo] → Retorna `{ error: '403', message: '...' }` + Winston warn
Reglas inquebrantables:
✅ El frontend nunca decide si una acción es permitida.
✅ El main process siempre valida antes de tocar la DB.
✅ Los permisos se cargan una vez por sesión y se cachean en RAM.
✅ Cualquier cambio de rol invalida caché y fuerza re-login o re-sync.
🗃️ Modelo de Datos (Drizzle/SQLite)
Tablas requeridas
Tabla
Propósito
Campos clave
users
Usuarios del sistema
id, username, password_hash, role_id, is_active, created_at
roles
Definición de roles
id, name (admin, secretario, legislador), description
permissions
Catálogo de permisos atómicos
id, code (CAN_CREATE_SESSION), module, description
role_permissions
Mapeo N:N roles ↔ permisos
role_id, permission_id (PK compuesta)
Relaciones
users.role_id → roles.id
role_permissions.role_id → roles.id
role_permissions.permission_id → permissions.id
💡 Diseño pragmático: Las tablas se pueblan en migración inicial. No se esperan CRUD dinámicos de permisos en v1. La asignación se hace vía semilla (seed) y se bloquea edición directa.

🔑 Mapeo de Roles a Permisos Atómicos
Permiso (código)
Módulo
Descripción
Admin
Secretario
Legislador
CAN_MANAGE_USERS
Directorio
Crear/editar/eliminar cuentas y asignar roles
✅
❌
❌
CAN_MANAGE_ROLES
Directorio
Modificar asignaciones de permisos por rol
✅
❌
❌
CAN_CREATE_SESSION
Sesiones
Registrar sesiones ordinarias/extraordinarias
✅
✅
❌
CAN_EDIT_MINUTES
Sesiones
Redactar, corregir o firmar actas
✅
✅
❌
CAN_CREATE_BILL
Legislación
Registrar proyectos de ley o iniciativas
✅
✅
✅
CAN_VOTE_BILL
Legislación
Emitir voto en proyectos asignados
❌
❌
✅
CAN_MANAGE_OFICIOS
Correspondencia
Crear, vincular y enviar oficios
✅
✅
❌
CAN_VIEW_AUDIT_LOG
Auditoría
Consultar historial de acciones y accesos
✅
✅
❌
CAN_EXPORT_DATA
Reportes
Exportar listas, actas o leyes a PDF/CSV
✅
✅
✅
CAN_SYNC_PORTAL
Sistema
Ejecutar sincronización con GitHub Pages
✅
Reglas de asignación:
Un usuario pertenece a un solo rol activo.
Los permisos son exclusivos por rol en v1 (no asignación directa a usuario).
Si se requiere excepción futura, se añadirá tabla user_permissions_override (no planificada ahora).

🛡️ Backend: Guards y Middleware IPC
Patrón de middleware para handlers

[Handler Original] → (req, payload) => { ... lógica ... }
       ↑
[Wrapper] → requirePermission('CAN_CREATE_SESSION')(handler)

Comportamiento del wrapper:
Extrae sessionId o userId de la sesión activa.
Busca permisos cacheados en memoria (Map<userId, Set<permissionCode>>).
Si el permiso está presente → ejecuta el handler.
Si falta → registra logger.warn('auth:forbidden', { userId, permission }) y retorna { error: '403', message: 'Acción no autorizada' }.
Si la sesión no existe o expiró → retorna { error: '401', message: 'Sesión inválida' }.
Validación con Zod:
Cada payload de IPC que modifica datos sensibles se valida con su esquema Zod antes de pasar al handler.
Si Zod falla → se rechaza inmediatamente, sin consultar permisos (fail-fast).
💻 Frontend: Componentes y Contexto
1. Contexto de Permisos
useAuth() o SessionContext expone: { user, permissions: Set<string>, isLoading }
Se pobla tras login exitoso o primer arranque (onboarding).
Se actualiza solo en: login, logout, cambio de rol forzado por admin.
2. Componente <Can>
Props: { permission: string, children: ReactNode, fallback?: ReactNode }
Lógica:
  if (!permissions.has(permission)) return fallback || null
  return children
  Uso: Ocultar botones, enlaces o secciones completas sin romper layout.
3. Componente <ProtectedRoute>
Props: { permission: string, children: ReactNode, redirectPath?: string }
Lógica:
  if (!permissions.has(permission)) navegar a redirectPath ("/dashboard")
  if (!isLoading) render children
  else mostrar <Skeleton />
  Uso: Rutas protegidas en react-router o navegación interna.
4. Mensajes de acceso denegado (UX)
Si el usuario intenta acceder por URL directa o atajo sin permiso:
Redirige a /dashboard
Muestra toast: "No cuenta con los permisos necesarios para acceder a esta sección. Contacte al administrador si requiere acceso." (tipo warning)
Registra intento en auditoría.
🔄 Ciclo de Vida de la Sesión y Caché
Evento
Acción en Permisos
Login exitoso
Cargar permisos desde DB → guardar en SessionContext → marcar caché válido
Cierre de app
Persistir sessionId en localStorage (opcional) o limpiar todo
Reapertura
Restaurar sesión → validar contra DB → refrescar permisos
Admin cambia rol de usuario
Invalidar caché de ese usuario → forzar re-auth en próxima interacción
Logout
Limpiar SessionContext, eliminar tokens, vaciar caché de permisos
✅ Checklist de Implementación
Fase
Acción
Criterio de éxito
1
Crear migración Drizzle para users, roles, permissions, role_permissions
Tablas creadas, relaciones verificadas, seed ejecutable
2
Poblar permisos atómicos y mapeos por rol en db/seed.ts
10 permisos, 3 roles, asignaciones correctas en DB
3
Implementar requirePermission() middleware en main process
Rechaza 403 si falta permiso, permite si existe, loguea intentos
4
Crear SessionContext + carga inicial de permisos tras login
Contexto disponible en toda la app, sin re-fetch innecesario
5
Implementar <Can> y <ProtectedRoute> en renderer
UI oculta/muestra correctamente, redirección funciona
6
Integrar validación en handlers IPC críticos (sesiones, oficios, usuarios)
0 accesos no autorizados en pruebas, logs claros
7
Añadir toast de acceso denegado + registro en auditoría
UX informativa, trazabilidad completa
8
Commit y documentación
feat(security): implement atomic RBAC with IPC guards
📊 Métricas de Validación
Indicador
Umbral
Método de verificación
Accesos no autorizados ejecutados
0
Pruebas de penetración manual + logs de auditoría
Latencia de verificación de permiso
< 50ms
Benchmark en main process
Consistencia UI ↔ Backend
100%
Playwright: intentar acción ocultada + verificar rechazo IPC
Errores silenciosos de permiso
0
Revisión de logs Winston tras pruebas
Tiempo de carga de permisos post-login
< 200ms
DevTools + perfilado de consulta Drizzle
📝 Notas de Arquitectura
Aspecto
Recomendación
shadcn/ui
Usar <Alert> con variant="destructive" para mensajes de acceso denegado. <Skeleton> para estados de carga de rutas protegidas.
Electron IPC
Agrupar canales por módulo (session:*, bill:*, user:*). Aplicar middleware al registrar handlers, no dentro de cada función.
Winston
Loguear solo warn/error para accesos denegados. No loguear permisos válidos para evitar ruido.
Testing
Mockear SessionContext en componentes <Can>. Usar vitest para middleware. Playwright para flujo completo: login → acción permitida → logout → acción denegada.
Escalabilidad
Si en el futuro se requieren permisos por registro (ej: "solo editar leyes de tu comisión"), añadir capa resourceOwner o scope sin romper estructura actual.
