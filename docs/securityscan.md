# 🛡️ Security Scan Implementation: `cerebro_legislativo`

## 🎯 Objetivo General
Implementar un sistema de escaneo de seguridad automatizado para el repositorio `cerebro_legislativo` que detecte:
1. Vulnerabilidades en código fuente (SAST)
2. Secretos expuestos (API keys, tokens, passwords)
3. Dependencias vulnerables (SCA)
4. Configuraciones inseguras en CI/CD y Electron

**Stack objetivo**: Electron 28 + Node.js + React 18 + Drizzle ORM + SQLite + Vitest + GitHub Actions

---

## 📋 Contexto del Proyecto (Para el Agente)

```yaml
Repositorio: github.com/joseamorenoc025/cerebro_legislativo
Arquitectura: Desktop (Electron) offline-first + Portal estático (GitHub Pages)
Usuario único: Secretario de Cámara (sin RBAC complejo)
Lenguajes principales: JavaScript/TypeScript, SQL (Drizzle), HTML/CSS
Herramientas existentes: 
  - npm audit (dependencias)
  - Vitest (tests)
  - GitHub Actions (CI/CD)
  - Winston (logging)
  - Zod (validación IPC)
```

---

## 🔍 Escaneos Requeridos (Priorizados)

### 1️⃣ Gitleaks: Detección de Secretos (CRÍTICO - Prioridad Alta)
**Propósito**: Evitar que API keys, tokens de GitHub, passwords o claves de cifrado queden hardcodeados.

**Archivos a crear/modificar**:
- `.gitleaks.toml` (configuración de reglas)
- `.github/workflows/security-gitleaks.yml` (CI/CD integration)
- `scripts/security/scan-secrets.sh` (script local opcional)

**Pasos para el agente**:
1. Crear `.gitleaks.toml` con:
   - Reglas predefinidas para: GitHub tokens, AWS keys, Google API keys, generic passwords
   - Paths a excluir: `node_modules/`, `dist/`, `*.lock`, `*.min.js`
   - Allowlist para falsos positivos conocidos del proyecto

2. Configurar GitHub Action `security-gitleaks.yml`:
   ```yaml
   name: Secret Scan
   on: [push, pull_request]
   jobs:
     gitleaks:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
           with:
             fetch-depth: 0  # Required for full history scan
         - uses: gitleaks/gitleaks-action@v2
           env:
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```

3. Crear script local `scripts/security/scan-secrets.sh`:
   ```bash
   #!/bin/bash
   # Ejecutar gitleaks localmente si está instalado
   if command -v gitleaks &> /dev/null; then
     gitleaks detect --source . --report-path reports/gitleaks-report.json --redact
   else
     echo "⚠️ Gitleaks no instalado. Instalar con: go install github.com/gitleaks/gitleaks@latest"
   fi
   ```

**Validaciones obligatorias**:
- [ ] El workflow falla si se detecta un secreto real (no falso positivo)
- [ ] Los falsos positivos del proyecto están allowlisteados en `.gitleaks.toml`
- [ ] El reporte se genera en `reports/gitleaks-report.json` para revisión manual

---

### 2️⃣ Semgrep: SAST para JavaScript/Electron (Prioridad Alta)
**Propósito**: Detectar patrones inseguros en código: eval(), insecure crypto, XSS, IPC validation gaps.

**Archivos a crear/modificar**:
- `.semgrep.yml` o `semgrep.config.yaml` (reglas custom)
- `.github/workflows/security-semgrep.yml`
- `scripts/security/scan-code.sh`

**Pasos para el agente**:
1. Crear configuración Semgrep con reglas relevantes para Electron:
   ```yaml
   # .semgrep.yml
   rules:
     - id: electron-unsafe-ipc-validate
       pattern: ipcMain.handle($NAME, async ($event, $data) => { ... })
       message: "IPC handler sin validación Zod detectada. Validar entrada con schema antes de procesar."
       languages: [javascript, typescript]
       severity: WARNING
   
     - id: insecure-crypto-md5-sha1
       patterns:
         - pattern: crypto.createHash("md5")
         - pattern: crypto.createHash("sha1")
       message: "MD5/SHA1 no son seguros para integridad. Usar SHA-256 o superior."
       languages: [javascript]
       severity: ERROR
   
     - id: eval-usage-detected
       pattern: eval($CODE)
       message: "eval() es inseguro. Usar alternativas seguras como JSON.parse o Function constructor con sandbox."
       languages: [javascript]
       severity: ERROR
   ```

2. Configurar GitHub Action:
   ```yaml
   # .github/workflows/security-semgrep.yml
   name: Code Security Scan
   on: [push, pull_request]
   jobs:
     semgrep:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: returntocorp/semgrep-action@v1
           with:
             config: >-
               p/security-audit
               p/nodejs
               .semgrep.yml
   ```

3. Crear script local para desarrollo:
   ```bash
   # scripts/security/scan-code.sh
   #!/bin/bash
   if command -v semgrep &> /dev/null; then
     semgrep scan --config .semgrep.yml --config auto --error --output reports/semgrep-report.json
   else
     echo "⚠️ Semgrep no instalado. Instalar con: pip install semgrep"
   fi
   ```

**Validaciones obligatorias**:
- [ ] Semgrep detecta al menos 1 regla custom en código de prueba (crear archivo `test/security-false-positive.js` para validar)
- [ ] El workflow no falla por reglas de baja severidad (solo ERROR/CRITICAL bloquean merge)
- [ ] Los falsos positivos del proyecto están documentados en comentarios `// nosemgrep`

---

### 3️⃣ npm audit + Snyk: Dependencias Vulnerables (Prioridad Media)
**Propósito**: Identificar y corregir dependencias con vulnerabilidades conocidas.

**Archivos a crear/modificar**:
- `.snyk` (configuración de ignore rules si es necesario)
- `.github/workflows/security-deps.yml`
- `scripts/security/audit-deps.sh`

**Pasos para el agente**:
1. Mejorar script de auditoría existente:
   ```bash
   # scripts/security/audit-deps.sh
   #!/bin/bash
   echo "🔍 Ejecutando npm audit..."
   npm audit --audit-level=high --json > reports/npm-audit.json 2>/dev/null
   
   # Parsear resultados
   HIGH_VULNS=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' reports/npm-audit.json)
   
   if [ "$HIGH_VULNS" -gt 0 ]; then
     echo "❌ Se encontraron $HIGH_VULNS vulnerabilidades de alta/crítica"
     echo "💡 Ejecuta 'npm audit fix' para corregir automáticamente las que sea posible"
     exit 1
   else
     echo "✅ No hay vulnerabilidades de alta/crítica"
   fi
   ```

2. Configurar GitHub Action (con opción para Snyk si hay token):
   ```yaml
   # .github/workflows/security-deps.yml
   name: Dependency Security Scan
   on:
     schedule:
       - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM UTC
     workflow_dispatch:  # Manual trigger
   jobs:
     audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: npm audit
           run: |
             npm audit --audit-level=high --json > reports/npm-audit.json || true
             # Parse and fail if critical
             HIGH=$(jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical' reports/npm-audit.json)
             if [ "$HIGH" -gt 0 ]; then exit 1; fi
         
         # Optional: Snyk if token exists
         - name: Snyk Test (optional)
           if: env.SNYK_TOKEN
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high --json-file-output=reports/snyk-report.json
   ```

**Validaciones obligatorias**:
- [ ] El script local genera reporte en `reports/npm-audit.json`
- [ ] El workflow falla si hay vulnerabilidades high/critical
- [ ] `npm audit fix` no rompe la app (validar con `npm test` post-fix)

---

### 4️⃣ GitHub CodeQL: Análisis Nativo (Prioridad Media)
**Propósito**: Aprovechar la integración nativa de GitHub para análisis profundo de código JavaScript.

**Archivos a crear/modificar**:
- `.github/codeql-config.yml` (opcional, para personalizar queries)
- `.github/workflows/codeql-analysis.yml` (si no existe)

**Pasos para el agente**:
1. Verificar si ya existe CodeQL en el repo. Si no, crear workflow:
   ```yaml
   # .github/workflows/codeql-analysis.yml
   name: "CodeQL Analysis"
   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]
     schedule:
       - cron: '0 3 * * 0'  # Weekly on Sunday
   
   jobs:
     analyze:
       name: Analyze
       runs-on: ubuntu-latest
       permissions:
         actions: read
         contents: read
         security-events: write
       
       strategy:
         fail-fast: false
         matrix:
           language: [ 'javascript' ]
       
       steps:
       - name: Checkout repository
         uses: actions/checkout@v4
       
       - name: Initialize CodeQL
         uses: github/codeql-action/init@v3
         with:
           languages: ${{ matrix.language }}
           config-file: ./.github/codeql-config.yml  # Optional
       
       - name: Autobuild
         uses: github/codeql-action/autobuild@v3
       
       - name: Perform CodeQL Analysis
         uses: github/codeql-action/analyze@v3
         with:
           category: "/language:${{matrix.language}}"
   ```

2. (Opcional) Personalizar queries en `.github/codeql-config.yml`:
   ```yaml
   queries:
     - uses: security-and-quality
     - uses: javascript/codeql-suites/javascript-security-extended.qls
   packs:
     codeql/javascript-queries: "*"
   ```

**Validaciones obligatorias**:
- [ ] CodeQL se ejecuta sin errores en CI
- [ ] Los resultados aparecen en GitHub Security tab del repo
- [ ] No hay falsos positivos críticos no mitigados

---

### 5️⃣ Reporte Consolidado y Dashboard (Prioridad Baja)
**Propósito**: Unificar resultados de todos los escaneos en un reporte legible para el Secretario de Cámara.

**Archivos a crear/modificar**:
- `scripts/security/generate-report.sh`
- `docs/SECURITY_REPORT_TEMPLATE.md`
- `SECURITY.md` (política de seguridad del proyecto)

**Pasos para el agente**:
1. Crear script de consolidación:
   ```bash
   # scripts/security/generate-report.sh
   #!/bin/bash
   REPORT_DATE=$(date +%Y-%m-%d)
   OUTPUT="reports/security-summary-$REPORT_DATE.md"
   
   cat > "$OUTPUT" << EOF
# 🔐 Reporte de Seguridad - $REPORT_DATE
## cerebro_legislativo

### Resumen Ejecutivo
EOF
   
   # Agregar resumen de cada herramienta
   echo "#### Gitleaks (Secretos)" >> "$OUTPUT"
   if [ -f reports/gitleaks-report.json ]; then
     FINDINGS=$(jq '.Results | length' reports/gitleaks-report.json)
     echo "- Hallazgos: $FINDINGS" >> "$OUTPUT"
   else
     echo "- No ejecutado" >> "$OUTPUT"
   fi
   
   # ... repetir para semgrep, npm audit, codeql
   
   echo -e "\n### Próximos Pasos\n- [ ] Revisar hallazgos de alta prioridad\n- [ ] Aplicar fixes automáticos donde sea posible" >> "$OUTPUT"
   
   echo "✅ Reporte generado: $OUTPUT"
   ```

2. Crear plantilla de política de seguridad `SECURITY.md`:
   ```markdown
   # Política de Seguridad de cerebro_legislativo
   
   ## Reportar una Vulnerabilidad
   Si encuentras un problema de seguridad, por favor NO lo publiques en issues públicos. 
   Envía un correo detallado a: [tu-email@dominio] o usa GitHub Security Advisories.
   
   ## Escaneos Automáticos
   Este proyecto ejecuta automáticamente:
   - 🔍 Gitleaks: detección de secretos en cada push/PR
   - 🛡️ Semgrep: análisis de patrones inseguros en código
   - 📦 npm audit: vulnerabilidades en dependencias
   - 🔬 CodeQL: análisis profundo nativo de GitHub
   
   ## Respuesta a Hallazgos
   - CRITICAL/ERROR: Bloquea merge, requiere fix inmediato
   - WARNING: Se registra, se planifica fix en próximo sprint
   - INFO: Documentado, sin acción requerida
   ```

**Validaciones obligatorias**:
- [ ] El reporte consolidado se genera sin errores
- [ ] `SECURITY.md` sigue el estándar de GitHub Security Policy
- [ ] Los scripts son idempotentes (se pueden ejecutar múltiples veces)

---

## 🗂️ Estructura de Archivos Esperada Post-Implementación

```
cerebro_legislativo/
├── .gitleaks.toml                    # Configuración de detección de secretos
├── .semgrep.yml                      # Reglas custom de SAST
├── .snyk                             # (Opcional) Ignore rules para Snyk
├── .github/
│   ├── codeql-config.yml             # (Opcional) Personalización de queries
│   └── workflows/
│       ├── security-gitleaks.yml     # Workflow de escaneo de secretos
│       ├── security-semgrep.yml      # Workflow de análisis de código
│       ├── security-deps.yml         # Workflow de auditoría de dependencias
│       └── codeql-analysis.yml       # (Si no existe) Workflow nativo de GitHub
├── scripts/security/
│   ├── scan-secrets.sh               # Script local para gitleaks
│   ├── scan-code.sh                  # Script local para semgrep
│   ├── audit-deps.sh                 # Script local para npm audit
│   └── generate-report.sh            # Consolidación de reportes
├── reports/                          # (Gitignored) Reportes generados
│   ├── .gitkeep
│   └── (archivos .json/.md generados)
├── docs/
│   ├── SECURITY_REPORT_TEMPLATE.md   # Plantilla de reporte
│   └── SECURITY.md                   # Política de seguridad (root)
├── SECURITY.md                       # (Root) Política de seguridad de GitHub
└── .gitignore                        # Agregar: reports/*.json, reports/*.md (excepto .gitkeep)
```

---

## 🔐 Consideraciones de Seguridad para la Implementación

```
✅ HACER:
• Ejecutar escaneos en CI/CD, no solo localmente
• Fallar el build solo para hallazgos CRITICAL/ERROR, no WARNING
• Documentar falsos positivos con comentarios `// nosemgrep` o allowlist en config
• Mantener configs de escaneo versionadas en el repo
• No commitear reportes con información sensible (usar .gitignore)

❌ NO HACER:
• Ejecutar escaneos que requieran tokens en forks públicos sin validación
• Bloquear merges por warnings que no son explotables en contexto Electron
• Exponer rutas internas o lógica de negocio en mensajes de error de escaneo
• Depender de herramientas que requieran conexión a servicios externos no disponibles en Venezuela
```

---

## 🧪 Validación Final (Checklist Pre-Merge)

```diff
+ [ ] Gitleaks detecta un secreto de prueba y falla el workflow
+ [ ] Semgrep detecta una regla custom en código de prueba
+ [ ] npm audit script falla si hay vulnerabilidad high/critical
+ [ ] CodeQL se ejecuta sin errores en CI
+ [ ] Todos los scripts locales funcionan con `bash scripts/security/*.sh`
+ [ ] Reports se generan en carpeta `reports/` y están .gitignored
+ [ ] SECURITY.md está en raíz del repo y sigue formato GitHub
+ [ ] .gitignore actualizado para excluir reportes sensibles
+ [ ] README.md actualizado con sección "🔐 Seguridad" que documenta los escaneos
```

---

## 📈 Métricas de Éxito

| Indicador | Meta | Cómo medir |
|-----------|------|-----------|
| Tiempo de detección de secretos | < 5 min desde commit | Timestamp de commit vs. alerta de Gitleaks |
| Falsos positivos por escaneo | < 5% del total | Revisión manual de reportes |
| Vulnerabilidades high/critical en producción | 0 | `npm audit --production` post-deploy |
| Cobertura de reglas custom | ≥ 10 reglas relevantes para Electron | Conteo en `.semgrep.yml` |
| Tiempo de respuesta a hallazgo crítico | < 24 horas | Issue creation timestamp vs. fix commit |

---

## 🚀 Instrucciones para el Agente (Antigravity)

1. **Escanea el contexto del repo primero**: Identifica qué herramientas ya están configuradas (ej: ¿ya hay `npm audit` en CI?).
2. **Implementa fase por fase**: Comienza con Gitleaks (más crítico), luego Semgrep, luego dependencias, luego CodeQL, finalmente reporting.
3. **Valida cada fase antes de continuar**: Ejecuta el script local o workflow y confirma que funciona antes de pasar a la siguiente herramienta.
4. **Mantén consistencia con el stack existente**: Usa las mismas convenciones de naming, estructura de carpetas y patrones de código que ya están en el repo.
5. **Documenta cada cambio**: Actualiza `CHANGELOG.md` con prefijo `security:` y agrega notas en los commits.
6. **Pregunta si hay ambigüedad**: Si una herramienta requiere configuración que no está clara en el contexto, pregunta antes de asumir.

**Formato de entrega por fase**:
```
✅ FASE X COMPLETADA:
• Archivos creados/modificados: [lista]
• Comandos de prueba: [comandos para validar]
• Próximos pasos: [qué falta para la siguiente fase]
• Pausa para confirmación: [esperar aprobación antes de continuar]
```

---

## 🎯 Entregable Final Esperado

Al completar todas las fases, el repo debe tener:
1. ✅ Escaneos automáticos en CI/CD para secretos, código y dependencias
2. ✅ Scripts locales para desarrollo y auditoría manual
3. ✅ Reportes consolidados y política de seguridad documentada
4. ✅ Cero vulnerabilidades high/critical sin mitigar en la rama main
5. ✅ Proceso claro para reportar y responder a hallazgos de seguridad

**Commit final sugerido**: 
```
feat(security): implement automated security scanning suite

- Add Gitleaks for secret detection (CI + local scripts)
- Add Semgrep for SAST with Electron-specific rules
- Enhance npm audit with reporting and CI integration
- Enable GitHub CodeQL analysis for deep code scanning
- Add consolidated reporting scripts and SECURITY.md policy
- Configure .gitignore for sensitive reports
- Update README with security scanning documentation

Security scans now run automatically on push/PR. 
Critical findings block merge. Reports generated in /reports (gitignored).
```

---

> 💡 **Nota para el agente**: Este proyecto ya tiene una arquitectura sólida y madura. Los escaneos de seguridad deben **complementar, no complicar**. Prioriza reglas relevantes para Electron/Node.js, evita ruido con falsos positivos, y mantén la simplicidad que caracteriza al proyecto.