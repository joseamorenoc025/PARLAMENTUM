🎯 Objetivo General
Eliminar la sensación de "app incompleta o rota" cuando no hay datos.
Guiar al usuario con acciones claras y contextuales en pantallas vacías.
Estandarizar el feedback de acciones (éxito, error, advertencia, info) mediante toasts consistentes, accesibles y no intrusivos.
Mantener coherencia visual y de tono con el diseño institucional existente.
🧩 1. Componente <EmptyState> Reutilizable
Props esperados
Prop
Tipo
Obligatorio
Descripción
icon
LucideIcon
✅
Ícono de contexto (tamaño 48x48, opacidad 0.6)
title
string
✅
Título formal (70%)
description
string
✅
Texto guía/acción (30%)
action
`{ label: string; onClick: () => void; variant?: 'default'
'outline' }`
❌
className
string
❌
Overrides de Tailwind
data-testid
string
❌
Para tests E2E
Estructura visual (concepto)

┌─────────────────────────────┐
│           [Icono]           │
│                             │
│        {title}              │
│                             │
│   {description}             │
│                             │
│   [ {action.label} ]        │ ← shadcn <Button />
└─────────────────────────────┘

Layout: flex flex-col items-center justify-center text-center p-8 min-h-[60vh]
Tipografía: title: text-xl font-semibold, description: text-muted-foreground text-sm mt-2 max-w-md
Accesibilidad: role="status", aria-live="polite", contraste AA garantizado por shadcn.

Módulo
Ícono (Lucide)
Título (70% formal)
Descripción (30% guía)
Acción primaria
Sesiones
CalendarClock
No hay sesiones registradas
Registre la primera sesión ordinaria para habilitar el control de actas, asistencia y proyectos.
Crear sesión
Oficios
FileText
Bandeja de oficios vacía
Los documentos oficiales generados aparecerán aquí. Comience redactando uno nuevo.
Redactar oficio
Leyes
Scale
Biblioteca legislativa sin contenido
Importe o registre leyes sancionadas para habilitar búsqueda, archivo digital y portal público.
Importar ley
Comisiones
Users
No se han configurado comisiones
Las comisiones organizan el trabajo legislativo. Cree la primera para asignar legisladores y expedientes.
Crear comisión
Legisladores
UserPlus
Directorio de legisladores vacío
Registre a los miembros activos para gestionar sesiones, votaciones y directorio de transparencia.
Agregar legislador
Sync GitHub
CloudOff → CloudCheck (condicional)
Sincronización pendiente
Configure su repositorio para publicar el portal de leyes. Los cambios se mantendrán locales hasta conectar.
Configurar sincronización

💡 Regla de aplicación: El EmptyState solo se renderiza cuando !loading && !error && data.length === 0. Nunca mostrar durante carga o tras fallo.
🔔 3. Sistema de Toasts: sonner
¿Por qué sonner?
✅ Nativo para React moderno, 0 dependencias pesadas.
✅ Integración perfecta con shadcn/ui y Tailwind.
✅ Accesible por defecto (ARIA, focus trap, screen-reader friendly).
✅ Soporta promesas, colas y auto-dismiss inteligente.
Configuración base (concepto)
Posición: bottom-right
Duración:
success: 4s
info: 4s
warning: 6s
error: persistente (hasta que usuario cierre)
Límite de cola: máx. 3 visibles simultáneamente
Comportamiento: no bloqueante, no modal, clic para cerrar
Tipos estandarizados y reglas
Tipo
Uso
Ejemplo
Acción opcional
success
Operación completada
"Sesión creada y vinculada al expediente correctamente."
Ninguna
error
Fallo crítico
"No puede eliminar una sesión con acta firmada. Anúlela primero."
"Ver guía" (abre doc contextual)
warning
Estado límite
"La ley tiene 3 versiones pendientes de revisión."
"Ver historial"
info
Notificación contextual
"Sincronización en progreso. El portal se actualizará en ~1 min."
Ninguna
promise
Operación asíncrona
"Importando PDF..." → resuelve a success/error
Barra de progreso interna
Integración con Winston (opcional pero recomendado)
Todos los toasts error se loguean automáticamente: logger.warn('toast:error', { message, context })
success/info no se loguean para evitar ruido en producción.
🔄 4. Patrón de Gestión de Estado (useState optimizado)
Dado que usas useState local, aplica este flujo condicional en cada vista:

[Estado] → loading | success | error | empty
[Render] → 
  1. if (loading) → <Skeleton /> o <Spinner />
  2. if (error)   → toast.error() + <EmptyState icon={AlertCircle} title="..." description="..." />
  3. if (empty)   → <EmptyState {...catalogo[modulo]} />
  4. else         → <DataTable /> o <ListView />

Reglas de oro
Nunca mezclar loading con empty: si hay carga, muestra spinner/skeleton.
El empty solo aparece tras carga exitosa con length === 0.
Los toasts se disparan en el useEffect de respuesta o en el callback del IPC, nunca en el render.
Cachea estados vacíos: si el usuario cierra y vuelve a abrir, mantén el EmptyState sin re-fetch innecesario (usa sessionStorage o useState persistente en la sesión).
✅ 5. Checklist de Implementación
Paso
Acción
Criterio de éxito
1
npm install sonner + envolver App con <Toaster />
Toasts renderizan sin errores en consola
2
Crear src/components/ui/empty-state.jsx con props definidas
Acepta icono, título, descripción, acción. Responsive y accesible
3
Reemplazar vistas: Sesiones → Oficios → Leyes → Comisiones → Legisladores
Cada una muestra EmptyState correcto al iniciar sin datos
4
Integrar toast en flujos de creación/edición/eliminación
Feedback inmediato, sin bloqueos, duración correcta
5
Validar accesibilidad
Navegación por teclado, contraste AA, screen-reader lee título y descripción
6
Commit y PR
chore(ui): implement empty states + sonner toasts
Métricas de validación UX
✅ Tiempo de comprensión del estado vacío: <2 segundos (test con usuario nuevo)
✅ Tasa de clic en acción primaria: >60% en pantallas vacías
✅ Errores silenciosos: 0 (todos los fallos generan toast.error)
✅ Re-renders innecesarios: 0 (usar React.memo en EmptyState)
📝 Notas de Arquitectura
Aspecto
Recomendación
shadcn/ui
Usa <Card> o <div> con bg-background/50 como contenedor del EmptyState. Aprovecha text-muted-foreground y btn-primary.
Lucide
Importa solo los usados: import { CalendarClock, FileText, Scale, Users, UserPlus, CloudOff } from 'lucide-react'. No importar todo el bundle.
Performance
Envuelve <EmptyState> en React.memo. Los íconos y textos son estáticos por módulo.
Electron IPC
Los errores de IPC (ipcRenderer.invoke) deben mapearse a toast.error con mensaje legible, nunca exponer stack traces al renderer.
Testing
Añade data-testid="empty-state-{modulo}" para Playwright. Verifica que el botón de acción dispare la ruta/modal correcto.