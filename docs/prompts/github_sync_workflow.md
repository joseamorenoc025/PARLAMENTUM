# 1. Guarda este archivo en tu repo
# 2. Ejecuta con Gemini CLI:
gemini-cli --prompt "docs/prompts/github_sync_workflow.md" --context "https://github.com/joseamorenoc025/cerebro_legislativo"

# 3. El agente trabajará FASE POR FASE.
#    Detente tras cada fase, valida en local, y luego continúa con:
gemini-cli --prompt "Continuar con Fase X según el prompt de github_sync_workflow.md"
🤖 Prompt: Implementación de Sync Cerebro Legislativo → GitHub → Portal Web
📌 Contexto del Proyecto
Nombre: cerebro_legislativo
Stack actual: Electron (main) + React/Vite (renderer) + Drizzle ORM + SQLite + Vitest + Winston + Zod
Objetivo: Automatizar la publicación de metadata de leyes a un repositorio GitHub para alimentar un portal web estático (GitHub Pages), manteniendo los PDFs en Google Drive.
Flujo deseado:
Usuario agrega/actualiza ley local → App sincroniza metadata a leyes.json en GitHub → GitHub Pages se reconstruye → Ciudadano escanea QR único → accede a portal web → busca/filtra → descarga PDF desde Drive.
🏗️ Arquitectura Conceptual
[Local DB SQLite] 
       ↓ (detecta cambios)
[Sync Engine (main process)] 
       ↓ (GitHub REST API: GET + PUT con SHA)
[github.com/joseamorenoc025/cerebro_legislativo → leyes.json] 
       ↓ (commit automático)
[GitHub Pages → /portal/index.html] 
       ↓ (fetch leyes.json en tiempo real)
[Ciudadano: navegador móvil → busca/filtra → descarga PDF]
Reglas de diseño:
✅ Solo metadata en Git (nunca PDFs)
✅ PDFs residen en Google Drive (links directos en JSON)
✅ Token GitHub almacenado seguro (OS keychain, nunca en código ni repos)
✅ Cola offline para resiliencia ante falta de red
✅ Resolución de conflictos basada en sha de archivo + merge por ID de ley
✅ Portal estático, sin backend, sin dependencias externas pesadas
🛠️ Fases de Implementación (Estrictamente Secuencial)
🔹 FASE 1: Estructura Base y Cliente GitHub API
Objetivo: Crear módulo de sync con cliente seguro a GitHub API y validación de token.
Crear electron/src/modules/sync/
Implementar githubClient.js:
getRemoteFile(path): retorna { content, sha }
updateFile(path, content, message, sha): hace PUT con verificación de SHA
Manejo de rate limits y reintentos
Configurar almacenamiento seguro de PAT:
Usar keytar o módulo nativo equivalente
Funciones: saveToken(), loadToken(), clearToken()
Validar conexión con GET /user al iniciar app
Entregable: Módulo funcional, sin UI, testeable con script CLI.
Stop & Confirm: Ejecutar script de prueba con token real. Validar GET/PUT. NO continuar hasta confirmación.
🔹 FASE 2: Lógica de Sync y Delta
Objetivo: Leer DB local, comparar con remoto, generar delta seguro.
Crear syncEngine.js:
Leer leyes desde Drizzle (SELECT * FROM leyes ORDER BY updated_at)
Normalizar a formato leyes.json
Comparar con remoto usando expediente + año como clave única
Generar array de cambios: add, update, noop
Merge preservando histórico (no sobrescribir campos no modificados)
Validar con Zod antes de serializar
Entregable: Lógica pura, sin efectos secundarios, cubierta por tests unitarios.
Stop & Confirm: Ejecutar tests. Simular conflicto (modificar remoto manualmente). Validar que merge no pierda datos.
🔹 FASE 3: Cola Offline y Resiliencia
Objetivo: Garantizar que ningún cambio se pierda por falta de conexión.
Crear syncQueue.js (persistencia en SQLite o JSON local)
Estados: pending, syncing, synced, failed
Al guardar ley en UI → encolar add/update → intentar sync inmediato
Si falla por red → persistir en cola → reintentar con backoff exponencial
Procesar cola en segundo plano (setInterval o queue worker)
Notificar estado en renderer vía IPC
Entregable: Cola funcional, pruebas de desconexión/reconexión, logs claros.
Stop & Confirm: Simular desconexión → agregar ley → reconectar → verificar commit en GitHub.
🔹 FASE 4: Integración UI/UX en Cerebro Legislativo
Objetivo: Exponer sync al usuario/admin de forma segura y clara.
Agregar en main.js registro de IPC: sync:status, sync:force, sync:configure
UI en renderer:
Indicador de estado: 🟢 Sincronizado / 🟡 Pendiente / 🔴 Error
Botón "Sincronizar ahora"
Modal de configuración de token (primera vez)
Log visual de últimos eventos sync
Validar permisos antes de permitir sync
Entregable: Flujo completo desktop → validación local.
Stop & Confirm: Probar flujo completo desde UI. Verificar que commit aparece en GitHub.
🔹 FASE 5: Portal Web (GitHub Pages)
Objetivo: Web estática que lea leyes.json y ofrezca búsqueda/filtros/descarga.
Crear /public/portal/ en repo:
index.html, styles.css, app.js (vanilla, sin build)
app.js:
fetch('./leyes.json') → renderizar lista
Búsqueda en tiempo real (input → filter)
Filtros: año, estado, categoría
Botón "Descargar PDF" → abre drive_link_direct
Indicador de última actualización
Configurar GitHub Pages: source main, folder / (root) o /docs
Entregable: Portal funcional, responsive, accesible, sin dependencias externas.
Stop & Confirm: Desplegar a https://joseamorenoc025.github.io/cerebro_legislativo/portal. Probar en 2 móviles. Validar descarga Drive.
🔒 Seguridad y Buenas Prácticas (No Negociables)
✅ Token GitHub nunca en código, logs ni commits
✅ Usar SHA en PUT para evitar race conditions
✅ Rate limit handling (5000/h autenticado, backoff en 429)
✅ Validar entrada con Zod antes de sync
✅ No incluir PDFs, DBs, secrets en repo
✅ Portal: sin trackers, sin analytics invasivos, sin login
✅ Logs locales solo, no enviar metadados a terceros
📤 Entregables por Fase
Cada fase debe incluir:
Estructura de archivos nuevos/modificados
Código clave (modular, comentado, tipado si aplica)
Instrucciones de prueba local
Checklist de validación
Próximos pasos claros
🧪 Validación Final (Checklist Pre-Release)
Sync funciona con red estable
Sync encola y recupera tras desconexión
GitHub Pages se actualiza en <2 min tras commit
Portal carga en 3G, busca/filtra en <1s
Descarga Drive funciona sin pedir login
Token seguro, no expuesto en logs
Tests unitarios >80% en sync module
Documentación de despliegue en docs/SYNC_GUIDE.md
📝 Instrucciones para el Agente (Gemini CLI)
Trabaja estrictamente fase por fase. No generes código de fases futuras.
Prioriza seguridad, resiliencia y mantenibilidad sobre velocidad.
Usa la estructura existente del repo (electron/src/, src/, test/).
Si hay ambigüedad técnica, pregunta antes de asumir.
Entrega cada fase con: archivos, código, pruebas, validación, y pausa explícita.
Mantén consistencia con Zod, Drizzle, Winston, y patrones IPC ya establecidos.
