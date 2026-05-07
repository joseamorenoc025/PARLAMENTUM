Propósito: Especificación técnica y de UX para el asistente de primera ejecución (Onboarding Wizard) en cerebro_legislativo.
Stack objetivo: Electron (main) + React (renderer) + Tailwind + shadcn/ui + Zod + Drizzle/SQLite.
Tono de mensajes: 70% institucional/formal + 30% guía/acción.
🎯 Objetivo General
Guiar al usuario no técnico durante la primera apertura de la aplicación.
Crear la cuenta de Administrador General y configurar datos institucionales básicos.
Eliminar la dependencia de manuales externos para el arranque inicial.
Permitir posponer configuración sin bloquear el acceso al sistema.
Garantizar persistencia de progreso y resiliencia ante cierres inesperados.
🔍 Detección y Activación
Condición
Comportamiento
SELECT COUNT(*) FROM users = 0
Wizard se activa automáticamente al iniciar
SELECT value FROM app_settings WHERE key = 'onboarding_completed' = 'false'
Wizard se muestra en primer plano (modal/pantalla completa)
Usuario hace clic en "Configurar más tarde"
Se guarda onboarding_completed = 'true', se cierra wizard, se habilita dashboard vacío con empty states
Cierre inesperado (crash, kill)
Al reiniciar, se recupera el último paso guardado en localStorage o app_settings
Regla de oro: El wizard no bloquea la app tras el primer cierre. El administrador puede acceder a la configuración avanzada en cualquier momento desde ⚙️ Ajustes > Configuración inicial.
🧭 Estructura de Pasos (4 Fases)
Paso
Título
Propósito
Componentes shadcn/ui clave
Validación (Zod)
1
Bienvenida
Contexto institucional y expectativas
Card, Progress, Button (continuar/saltar)
Ninguna (solo UX)
2
Cuenta Administrador
Crear usuario root con credenciales seguras
Input, Label, PasswordStrength, Alert
username, password (8+, mezcla, sin espacios), securityQuestion, securityAnswer
3
Datos Institucionales
Personalización de la app y documentos
Input, Textarea, FileUpload (logo), Select (zona horaria)
chamberName (2-50 chars), timezone (valid IANA)
4
Finalización
Confirmación y acceso al sistema
Table (resumen), Checkbox (backup), Button (ir al panel/configurar luego)
Ninguna (solo confirmación)
📐 Diseño de Flujo por Paso (UX + Lógica)
🔹 Paso 1: Bienvenida
[Logo institucional o ícono 🏛️]
Título: "Configuración inicial de Cerebro Legislativo"
Texto: "Este asistente le permitirá preparar el sistema en menos de 3 minutos. 
        Los datos configurados habilitarán la creación de sesiones, oficios y el portal público de leyes."
Acciones:
  [ Comenzar configuración ]   [ Configurar más tarde ]
  Comportamiento: Al hacer clic en "Comenzar", se avanza al paso 2. "Configurar más tarde" marca onboarding_completed = true y cierra el wizard.
Persistencia: No se guarda aún. Solo se avanza si el usuario decide continuar.
🔹 Paso 2: Cuenta Administrador
Título: "Crear cuenta de Administrador General"
Texto: "Esta cuenta tendrá control total del sistema. Guarde sus credenciales en un lugar seguro."

Campos:
• Usuario: [____________] (ej: admin.camara)
• Contraseña: [____________] + medidor visual (débil/media/fuerte)
• Confirmar contraseña: [____________]
• Pregunta de seguridad: [¿Cuál fue su primera mascota?] (dropdown)
• Respuesta: [____________]

Nota institucional: "En caso de olvido, contacte al soporte técnico con su documento de identidad."
Acción: [ Continuar ]
Validación Zod:
password: min 8, 1 mayúscula, 1 número, 1 símbolo especial opcional pero recomendado
answer: min 3 chars, se almacena como hash (bcrypt o SHA-256 con salt)
Seguridad: El hash se guarda en users. La respuesta nunca viaja en texto plano. Se genera un recovery_code de 8 caracteres (ej: A7K9-M2P4) que se muestra en el paso 4 para imprimir/guardar.
🔹 Paso 3: Datos Institucionales
Título: "Información de la Cámara Legislativa"
Texto: "Estos datos se utilizarán en documentos oficiales, encabezados y el portal público."

Campos:
• Nombre oficial: [Cámara de Diputados del Estado de...]
• Lema institucional (opcional): ["Justicia y Progreso"]
• Zona horaria: [America/Mexico_City ▼]
• Logo oficial: [📎 Arrastre o seleccione imagen] (PNG/JPG, máx 2MB, se redimensiona a 200x80px)
Acción: [ Continuar ]
Validación Zod: chamberName requerido, timezone debe coincidir con lista IANA, logo validado por MIME y tamaño.
Almacenamiento: logo se guarda en app.getPath('userData')/assets/logo.png. La ruta relativa se guarda en app_settings.
🔹 Paso 4: Finalización y Respaldo
Título: "Configuración lista para iniciar"
Tabla resumen:
  • Administrador: admin.camara ✅
  • Cámara: [nombre] ✅
  • Zona horaria: [tz] ✅

[ ] He guardado mi código de recuperación en un lugar seguro.
  Código: A7K9-M2P4 (imprima o anote antes de continuar)

Acciones:
  [ Ir al Panel de Control ]   [ Exportar configuración a PDF ]
  Comportamiento: Al hacer clic en "Ir al Panel", se ejecuta transacción DB, se marca onboarding_completed = true, se cierra wizard, se navega a /dashboard.
Exportar: Genera un PDF simple con credenciales (excepto password), código de recuperación y datos institucionales. Se descarga a Descargas/.
Dato
Tabla/Archivo
Formato
Encriptación/Hash
username
users
texto plano
No
password_hash
users
bcrypt $2b$...
✅
security_question
users
texto plano
No
security_answer_hash
users
SHA-256 + salt
✅
recovery_code_hash
users
SHA-256
✅
password_reset_required
users
boolean
true inicialmente
chamber_name, timezone, logo_path
app_settings
clave-valor
No
onboarding_completed
app_settings
clave-valor
No
⚠️ Transacción atómica: Todos los writes del paso 4 se ejecutan en una sola transacción SQLite. Si falla uno, se revierte todo y se mantiene el wizard abierto.
🔄 Gestión de Estado y Persistencia
Elemento
Implementación
currentStep
useState(0) en React
progress
localStorage.setItem('wizard_step', currentStep) (solo para recuperación tras cierre inesperado)
isComplete
app_settings.onboarding_completed en SQLite
skipAllowed
true en todos los pasos excepto paso 2 (requiere datos mínimos para operar)
Data draft
useRef o useState para acumular inputs hasta paso 4. No se escribe en DB hasta confirmación final.
Flujo de recuperación: Al iniciar la app, el renderer consulta onboarding_completed. Si es false, lee localStorage para restaurar currentStep y datos en borrador. Si el usuario cerró en paso 2, retoma desde ahí sin repetir.
♿ Accesibilidad y UX Avanzada
Requisito
Implementación
Navegación por teclado
Tab avanza entre campos, Enter confirma acción primaria, Esc cierra solo si permite salto
ARIA
role="dialog", aria-labelledby, aria-describedby en cada paso. aria-live="polite" para cambios de estado
Contraste
Cumple WCAG 2.1 AA (shadcn/ui por defecto). Textos de guía usan text-muted-foreground
Enfoque automático
Al cambiar de paso, useEffect enfoca el primer input visible
Responsivo
max-w-2xl mx-auto en pantallas >md. En móvil, pasos se apilan verticalmente sin scroll horizontal
Feedback de carga
Botón "Continuar" cambia a <Button disabled loading> mientras se valida/guarda
✅ Checklist de Implementación
Paso
Acción
Criterio de éxito
1
Crear src/components/onboarding/wizard.tsx
Renderiza pasos 1-4 según estado local
2
Integrar Progress y navegación Back/Next
Transiciones suaves, botón deshabilitado si validación falla
3
Implementar esquemas Zod por paso
Errores inline en tiempo real, sin submits fallidos
4
Conectar con IPC setup:create-admin y settings:save
Transacción atómica, rollback en error, toast de éxito
5
Agregar detección de primer arranque en App.tsx
Muestra wizard si onboarding_completed = false
6
Implementar persistencia de borrador en localStorage
Recuperación exacta tras cierre inesperado
7
Validar accesibilidad y responsive
Lighthouse ≥90, navegación por teclado completa
8
Commit y documentación
feat(onboarding): implement first-run wizard spec
Métricas de Validación UX
✅ Tiempo promedio para completar wizard: < 3 minutos
✅ Tasa de abandono en paso 2: < 10%
✅ Usuarios que logran acceder sin soporte: > 85%
✅ Errores de validación silenciosos: 0
📝 Notas de Arquitectura
Aspecto
Recomendación
shadcn/ui
Usar <Dialog> con overlay="true" y closeOnOverlayClick={false}. <Progress> para indicador visual. <Alert> para notas de seguridad.
Electron IPC
Crear canal setup:initialize que reciba { username, password, securityQ, securityA, chamberName, timezone, logoBuffer }. Main process hashea, escribe en transacción, retorna { success, userId }.
Logo processing
En renderer: convertir a base64 → enviar a main → main decodifica, redimensiona con sharp o jimp, guarda en userData/assets/, retorna ruta.
Testing
data-testid="wizard-step-{n}". Playwright: simular llenado, validación de errores, cierre inesperado, recuperación.
Internacionalización
Estructurar textos en objeto I18n.onboarding para futuro i18n. No hardcodear cadenas en JSX.
