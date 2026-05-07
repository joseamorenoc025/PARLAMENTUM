📌 Contexto del Proyecto
Nombre: cerebro_legislativo
Stack actual: Electron + React/Vite + Drizzle ORM + SQLite + Vitest + Winston + Zod + shadcn/ui
Objetivo: Simplificar la aplicación eliminando toda lógica multi-usuario, RBAC y permisos. El único usuario del sistema será el Secretario de Cámara, rol definido por reglamento institucional.
Principio rector: "Menos es más" — eliminar complejidad innecesaria sin perder funcionalidad crítica.
🏗️ Arquitectura Objetivo (Post-Simplificación)
[Desktop App — Único usuario: Secretario de Cámara]
       │
       ├── Gestión de sesiones y actas
       ├── Redacción y archivo de oficios
       ├── Importación y organización de leyes
       ├── Búsqueda local + comandos rápidos
       ├── Sincronización automática a GitHub Pages
       └── Backup local y exportación

[GitHub Pages — Portal Público]
       ├── /portal/ → Leyes (búsqueda + descarga + fallback)
       ├── /legisladores/ → Directorio público (solo lectura, JSON estático)
       └── Sin autenticación, sin backend, sin cookies
       🗑️ Qué ELIMINAR (Sin Piedad)
Tablas de Base de Datos (Drizzle Schema)
- roles
- permissions
- role_permissions
- user_permissions_override
- audit_log (si solo era para RBAC; mantener si es para trazabilidad de documentos)
- legislators (mover a JSON estático para portal público)
- votes, commissions (como entidades con relaciones complejas)
Lógica de Autorización
- Middleware requirePermission() en IPC handlers
- Componentes <Can> y <ProtectedRoute> en frontend
- Validación de roles en login/onboarding
- Cualquier referencia a "admin", "administrator", "role", "permission"
Flujos de Usuario Múltiple
- Login con selección de usuario
- Gestión de usuarios desde UI (CRUD de cuentas)
- Onboarding que crea múltiples roles
- Sesiones concurrentes o token refresh para múltiples usuarios
Terminología y UI
- Reemplazar "Administrador" → "Secretario de Cámara"
- Reemplazar "Admin Panel" → "Panel del Secretario"
- Reemplazar "Gestión de Usuarios" → Eliminar completamente
- Actualizar mensajes, tooltips, placeholders y documentación interna

✅ Qué MANTENER (Esencial)
Base de Datos (Schema Simplificado)
// Tablas que SÍ permanecen:
users: {
  // UN SOLO REGISTRO: el Secretario de Cámara
  id, username, password_hash, security_question_hash, security_answer_hash, recovery_code_hash, created_at
}
laws: { id, expediente, titulo, contenido, estado, fecha_publicacion, drive_link, content_hash, ... }
sessions: { id, tipo, fecha, orden_dia, acta_pdf, ... }
minutes: { id, session_id, contenido, firmada, ... }
oficios: { id, numero, destinatario, contenido, vinculado_a, ... }
app_settings: { key, value } // onboarding_completed, chamber_name, timezone, logo_path, etc.

Funcionalidades Core
✅ Autenticación única: login del Secretario (sin selección de usuario)
✅ Onboarding simplificado: crea solo la cuenta del Secretario + datos institucionales
✅ Gestión de documentos: sesiones, actas, oficios, leyes (CRUD completo)
✅ Búsqueda local + Command Palette (Ctrl+K)
✅ Sincronización automática a GitHub Pages (leyes.json, legisladores.json, config)
✅ Health check endpoint (app:health)
✅ Logging con Winston + analytics opt-in (skeleton)
✅ Empty states + toasts con Sonner

Portal Público (GitHub Pages)
✅ /portal/ → leyes con búsqueda, filtros, descarga + fallback a Drive
✅ /legisladores/ → directorio estático (nombre, partido, comisión, email institucional)
✅ Fallback para descargas fallidas: mostrar enlace directo de Drive si hay problema
✅ Sin autenticación, sin tracking invasivo, sin dependencias externas pesadas

🛠️ Fases de Implementación (Estrictamente Secuencial)
🔹 FASE 1: Limpieza de Schema Drizzle
Objetivo: Eliminar tablas innecesarias y simplificar users.
Editar electron/src/db/schema.js:
Eliminar: roles, permissions, role_permissions, legislators (como tabla relacional)
Simplificar users: quitar role_id, agregar comentario "Único registro: Secretario de Cámara"
Actualizar migraciones:
Crear nueva migración que elimine tablas obsoletas (drizzle-kit generate)
Asegurar que drizzle-kit migrate funcione sin errores en DB existente
Actualizar seeds (db/seed.ts):
Eliminar seed de roles/permisos
Mantener solo seed inicial del Secretario (opcional, o dejar que onboarding lo cree)
Entregable: Schema limpio, migraciones ejecutables, tests de schema pasando.
Stop & Confirm: Ejecutar npm run db:check y npm run db:migrate en entorno de prueba. Validar que la app inicia sin errores de tabla faltante.
🔹 FASE 2: Eliminar Lógica de Autorización
Objetivo: Remover guards, middleware y componentes de RBAC.
Backend (Electron main):
Eliminar archivo middleware.js o función requirePermission()
En cada handler IPC: remover validación de permisos, mantener solo validación de sesión activa
Simplificar authService.js: login solo verifica credenciales, no consulta roles
Frontend (React):
Eliminar componentes <Can> y <ProtectedRoute>
Remover imports de permissions en servicios y vistas
Simplificar SessionContext: ahora solo expone { user, isLoading }, sin permissions
Entregable: Código sin referencias a "permission", "role", "can". Tests de IPC pasando sin validación de permisos.
Stop & Confirm: Ejecutar npm test y verificar 0 errores de import/uso de permisos. Probar flujo: login → crear sesión → guardar oficio.
🔹 FASE 3: Simplificar Onboarding y Autenticación
Objetivo: Ajustar flujos para único usuario (Secretario de Cámara).
Onboarding Wizard:
Eliminar paso de "selección de rol" o "crear múltiples usuarios"
Renombrar títulos: "Crear cuenta de Administrador" → "Configurar cuenta del Secretario de Cámara"
Actualizar mensajes: tono institucional, referirse siempre a "Secretario de Cámara"
Login Screen:
Eliminar selector de usuario o lista de cuentas
Mensaje de ayuda: "Acceso exclusivo para el Secretario de Cámara"
Enlace de recuperación: mantener, pero referir a "Secretario" en textos
Entregable: Flujos de onboarding y login funcionando para único usuario. Textos actualizados en toda la UI.
Stop & Confirm: Probar onboarding desde cero (DB vacía) → verificar que solo se crea cuenta de Secretario. Probar login con credenciales correctas/incorrectas.
🔹 FASE 4: Actualizar Terminología en Toda la App
Objetivo: Consistencia lingüística: "Secretario de Cámara" en toda la interfaz.
Búsqueda y reemplazo global (case-sensitive para evitar falsos positivos):
"Administrador" → "Secretario de Cámara"
"Admin" → "Secretario" (solo cuando se refiere al rol, no a "administración" genérica)
"admin panel" → "panel del Secretario"
"user management" → eliminar completamente
Archivos a revisar:
src/**/*.jsx, src/**/*.js (frontend)
electron/src/**/*.js (backend)
public/portal/**/*.html,js (portal público)
docs/*.md (documentación interna)
Entregable: 0 referencias a "admin" como rol en código o docs. Mensajes coherentes en español institucional.
Stop & Confirm: Ejecutar grep -r "admin" src/ electron/src/ --include="*.js" --include="*.jsx" y validar que solo quedan usos genéricos (ej: "administración de archivos").
🔹 FASE 5: Preparar Subpágina /legisladores para Portal Público
Objetivo: Mover datos de legisladores a JSON estático para GitHub Pages.
Backend (Electron main):
Crear función exportLegislatorsForPortal(): lee DB local (si existe tabla temporal) o archivo CSV → genera legisladores.json
Estructura del JSON:
{
  "actualizado": "2026-05-07T...",
  "legisladores": [
    {
      "nombre": "María González",
      "partido": "Partido X",
      "comision": "Comisión de Salud",
      "email_publico": "maria.gonzalez@camara.gob.ve",
      "foto_rel_path": "legisladores/fotos/maria_gonzalez.jpg"
    }
  ]
}

Integrar con sync engine: al sincronizar, incluir legisladores.json y carpeta fotos/
Portal Público (public/legisladores/):
Crear index.html, styles.css, app.js (réplica del patrón de /portal/)
Funcionalidad: lista de tarjetas con filtro por partido/comisión, búsqueda por nombre
Sin datos sensibles: solo información pública institucional
Entregable: Subpágina funcional en GitHub Pages, actualizada automáticamente desde desktop app.
Stop & Confirm: Desplegar a GitHub Pages, verificar que https://.../legisladores/ carga y filtra correctamente. Validar que no hay datos personales expuestos.
🔹 FASE 6: Implementar Fallback para Descargas Fallidas
Objetivo: Resiliencia en portal público cuando Google Drive tiene problemas.
Portal Público (public/portal/app.js):
Agregar función setupDownloadFallbacks() (ver spec adjunta)
En cada tarjeta de ley: botón + fallback oculto que se muestra si la descarga no inicia en 5s
Estilo: mensaje discreto con enlace directo copiable
Entregable: Fallback funcional probado en Chrome, Firefox y móvil.
Stop & Confirm: Simular bloqueo de popup → verificar que fallback se muestra. Probar enlace alternativo en ventana incógnito.
🔒 Reglas No Negociables
✅ Nunca generar código multi-usuario o RBAC en el futuro sin aprobación explícita
✅ Mantener users table con solo UN registro válido (validar en app startup)
✅ Todos los mensajes al usuario deben referirse a "Secretario de Cámara", nunca a "admin"
✅ Portal público: sin autenticación, sin cookies, sin tracking invasivo
✅ Documentar cada cambio en CHANGELOG.md con prefijo simplify:
📤 Entregables por Fase
Cada fase debe incluir:
Lista de archivos modificados/eliminados
Resumen de cambios (sin código, solo descripción)
Instrucciones de prueba local
Checklist de validación
Pausa explícita para confirmación antes de continuar
🧪 Validación Final (Pre-Release)
Schema Drizzle sin tablas de RBAC/legisladores
0 referencias a "permission" o "role" en código ejecutable
Onboarding crea solo cuenta de Secretario
Login no permite selección de usuario
Portal público /legisladores/ carga y filtra correctamente
Fallback de descarga se muestra al simular fallo
Todos los mensajes en UI dicen "Secretario de Cámara"
npm test pasa sin errores
npm run build:linux (o tu plataforma) genera artefacto funcional
📝 Instrucciones para el Agente (Gemini CLI)
Trabaja estrictamente fase por fase. No generes código de fases futuras.
Prioriza eliminar sobre agregar: si hay duda, remover complejidad.
Usa la estructura existente del repo. No reorganices carpetas sin necesidad.
Si hay ambigüedad técnica, pregunta antes de asumir.
Entrega cada fase con: archivos, descripción, pruebas, validación, y pausa explícita.
Mantén consistencia con Zod, Drizzle, Winston, y patrones IPC ya establecidos.

Anexo: Spec Rápida para Fallback de Descarga (Fase 6)
// En public/portal/app.js, después de renderizar leyes:

function setupDownloadFallbacks() {
  document.querySelectorAll('[data-download-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const driveUrl = btn.dataset.driveUrl;
      const lawId = btn.dataset.lawId;
      const newTab = window.open(driveUrl, '_blank');
      
      if (!newTab) {
        document.getElementById(`fallback-${lawId}`).classList.remove('hidden');
        return;
      }
      
      setTimeout(() => {
        if (!newTab.closed) {
          document.getElementById(`fallback-${lawId}`).classList.remove('hidden');
        }
      }, 5000);
    });
  });
}

// HTML en cada tarjeta de ley:
/*
<button data-download-btn data-drive-url="URL" data-law-id="1234-2010">
  📥 Descargar PDF
</button>
<div id="fallback-1234-2010" class="fallback-link hidden mt-2 text-sm">
  ⚠️ ¿Problemas? <a href="URL" target="_blank">Acceder directamente a Google Drive</a>
</div>
*/
/* En public/portal/styles.css */
.fallback-link.hidden { display: none; }
.fallback-link {
  @apply bg-muted/50 p-2 rounded border border-border text-muted-foreground;
}
.fallback-link a { @apply underline hover:text-primary; }

