Propósito: Documento de referencia para implementar mejoras técnicas, abordar debilidades y escalar el proyecto a nivel 10/10.
Última actualización: $(date)
Estado: En progreso → Objetivo: 🎯 Profesional Senior / Open Source Ready
1. [GitHub Actions: Optimizaciones](#1-github-actions-optimizaciones)
2. [Testing: Integración IPC + E2E](#2-testing-integración-ipc--e2e)
3. [Base de Datos: Drizzle Kit Migrate](#3-base-de-datos-drizzle-kit-migrate)
4. [Observabilidad: Logger + Health Check](#4-observabilidad-logger--health-check)
5. [Seguridad: Validación de Input en IPC](#5-seguridad-validación-de-input-en-ipc)
6. [Calidad: Cobertura + Changelog Automático](#6-calidad-cobertura--changelog-automático)
7. [Distribución: Releases Automáticos + Package Managers](#7-distribución-releases-automáticos--package-managers)
8. [Analytics: Métricas Anónimas Opt-in](#8-analytics-métricas-anónimas-opt-in)
9. [Arquitectura: Sistema de Plugins](#9-arquitectura-sistema-de-plugins)
10. [IA: Análisis de Texto Legislativo](#10-ia-análisis-de-texto-legislativo)
11. [Amenazas: Mitigación de Riesgos](#11-amenazas-mitigación-de-riesgos)
12. [Roadmap: Biblioteca de Leyes MVP](#12-roadmap-biblioteca-de-leyes-mvp)
13. [Open Source: Plan de Publicación](#13-open-source-plan-de-publicación)
14. [Checklist Final: Ruta al 10/10](#14-checklist-final-ruta-al-1010)
15. [Estrategia de Backup: Local-Sync (Drive Desktop)](#15-estrategia-de-backup-local-sync-drive-desktop)
16. [Simplificación: Portal de Sesiones (GitHub Pages)](#16-simplificación-portal-de-sesiones-github-pages)

## 12. Roadmap: Biblioteca de Leyes 2.0
🔹 **Estado Actual:** 🛠️ Local-First. QR soporta enlaces manuales.
🔹 **Plan de Implementación:**

### Fase 1: Bóveda Local (Completado ✅)
- [x] **Eliminar API:** Removida dependencia de Google Cloud Console.
- [x] **Campo de Enlace:** Añadido `publicLink` para mapeo manual de QR a Drive.
- [x] **Gestión de Archivos:** Los PDFs se vinculan localmente para indexación.

### Fase 2: Automatización de Backup (Sugerido)
- [ ] **Carpeta Estándar:** Forzar el guardado de leyes en `%USERDATA%/leyes_backup` para facilitar la configuración de Drive Desktop.
- [ ] **Script de Exportación:** Crear un botón de "Exportar Todo para Backup" que genere un ZIP con la DB y los documentos.

## 15. Estrategia de Backup: Local-Sync (Drive Desktop)
🔍 **Contexto:** Debido a restricciones regionales, se evita el uso de Google Cloud API.

### Configuración Recomendada para el Usuario:
1. **Instalar Google Drive Desktop** en el PC.
2. **Vincular Carpeta:** En la app de Drive, seleccionar "Añadir carpeta" y elegir la ruta de datos de la aplicación:
   - `C:\Users\JOSE\AppData\Roaming\segundo-cerebro-legislativo`
3. **Flujo de QR Ciudadano:**
   - Sube el PDF a tu Drive manualmente (o deja que se sincronice).
   - Obtén el "Enlace para compartir" (asegúrate de ponerlo como "Cualquier persona con el enlace").
   - Pégalo en el campo **"Enlace Público"** de la Biblioteca en la app.
   - El código QR ahora llevará directamente a ese archivo en la nube.

---
14. Checklist Final: Ruta al 10/10
🔍 Situación Actual
# Duplicación en jobs:
- name: Setup Node
  uses: actions/setup-node@v4
  # ... configuración repetida
  ✅ Mejora: Consolidar con reusable setup
  # .github/workflows/ci.yml
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node  # 👈 Reusable action local
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-node  # 👈 Mismo setup, sin duplicar
      - run: npm test

      # .github/actions/setup-node/action.yml (nuevo)
name: 'Setup Node + Cache'
description: 'Configuración estándar de Node.js con cache de npm'
inputs:
  node-version:
    description: 'Versión de Node.js'
    required: false
    default: '20'
runs:
  using: 'composite'
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
    - name: Install dependencies
      shell: bash
      run: npm ci

      🎯 Beneficios

    ✅ DRY: Sin duplicación de configuración
    ✅ Mantenibilidad: Cambiar versión de Node en un solo lugar
    ✅ Legibilidad: Workflows más limpios y enfocados

    2. Testing: Integración IPC + E2E
🔹 2.1 Tests de Integración para IPC

// test/integration/ipc-handlers.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ipcMain } from 'electron'
import { setupIPCHandlers } from '../../electron/src/ipc/handlers.js'
import { logger } from '../../electron/src/lib/logger.js'

describe('IPC Handlers: Integration', () => {
  beforeEach(() => {
    vi.mocked(ipcMain.handle).mockClear()
    vi.mocked(logger).mockClear()
    setupIPCHandlers()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('laws:search', () => {
    it('registra el handler correctamente', () => {
      expect(ipcMain.handle)
        .toHaveBeenCalledWith('laws:search', expect.any(Function))
    })

    it('rechaza términos de búsqueda inválidos', async () => {
      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'laws:search'
      )[1]
      
      const result = await handler(null, { term: '', filters: {} })
      
      expect(result).toEqual({ error: 'Término de búsqueda inválido' })
      expect(logger.warn).toHaveBeenCalledWith(
        'Búsqueda inválida',
        expect.objectContaining({ term: '' })
      )
    })

    it('propaga errores de base de datos gracefulmente', async () => {
      // Mockear db.all para simular error
      vi.mocked(db.all).mockRejectedValue(new Error('DB_TIMEOUT'))
      
      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'laws:search'
      )[1]
      
      const result = await handler(null, { term: 'ley', filters: {} })
      
      expect(result).toHaveProperty('error')
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('app:health', () => {
    it('retorna estado saludable cuando DB está conectada', async () => {
      const handler = ipcMain.handle.mock.calls.find(
        ([channel]) => channel === 'app:health'
      )[1]
      
      const result = await handler()
      
      expect(result).toMatchObject({
        status: 'ok',
        db: 'connected',
        version: expect.stringMatching(/^\d+\.\d+\.\d+/)
      })
    })
  })
})

🔹 2.2 E2E Tests con Playwright

// test/e2e/laws-search.spec.js
import { test, expect, _electron as electron } from '@playwright/test'

test('búsqueda de leyes: flujo completo', async () => {
  const electronApp = await electron.launch({
    args: ['.', '--no-sandbox'] // Para CI
  })

  const window = await electronApp.firstWindow()
  
  // Abrir command palette
  await window.keyboard.press('ControlOrMeta+K')
  
  // Buscar ley
  await window.getByPlaceholder('Buscar leyes...').fill('transparencia')
  await window.keyboard.press('Enter')
  
  // Verificar resultados
  await expect(window.getByTestId('law-result')).toBeVisible()
  
  // Verificar que se registró la acción (si analytics está activo)
  // (Esto requeriría mockear logger o leer logs)
  
  await electronApp.close()
})

// playwright.config.js
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  reporter: [['html'], ['list']],
})

// package.json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:install": "playwright install --with-deps"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
3. Base de Datos: Drizzle Kit Migrate
🔍 Verificar Implementación Actual

# Ejecutar para verificar si drizzle-kit está configurado:
npx drizzle-kit check
npx drizzle-kit generate
npx drizzle-kit migrate

✅ Si NO está implementado: Configuración completa

// drizzle.config.js (actualizar)
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './electron/src/db/schema.js',
  out: './electron/src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/legis.db' // Ruta relativa o usar path.join con app.getPath()
  },
  // Para producción: usar variable de entorno
  // dbCredentials: {
  //   url: process.env.DATABASE_URL
  // }
})
// electron/src/db/migrate.js (actualizar para producción)
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './index.js'
import path from 'path'
import { app } from 'electron'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const runMigrations = () => {
  try {
    const migrationsPath = path.join(
      app.isPackaged 
        ? process.resourcesPath 
        : __dirname,
      'db/migrations'
    )
    
    migrate(db, { migrationsFolder: migrationsPath })
    console.log('✅ Migraciones aplicadas exitosamente')
    return true
  } catch (error) {
    console.error('❌ Error aplicando migraciones:', error)
    // En producción: considerar rollback o notificación al usuario
    if (process.env.NODE_ENV === 'production') {
      // Opción: crear backup y reintentar, o fallar gracefulmente
    }
    return false
  }
}
// package.json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:check": "drizzle-kit check",
    "db:studio": "drizzle-kit studio",
    "db:seed": "node scripts/seed.js"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0"
  }
}
🎯 Flujo de Trabajo Recomendado

# 1. Modificar schema.js
# 2. Generar migración:
npm run db:generate

# 3. Revisar el SQL generado en migrations/
# 4. Aplicar en desarrollo:
npm run db:migrate

# 5. En producción: se aplica automáticamente al iniciar la app

4. Observabilidad: Logger + Health Check
🔹 4.1 Logger: Agregar Contexto de Usuario/Acción

// electron/src/lib/logger.js (actualizar)
import winston from 'winston'
import { app } from 'electron'
import path from 'path'

// Función para obtener contexto dinámico
const getDynamicMeta = () => {
  // Esto podría leerse de un módulo de sesión global
  const session = global.appSession || {} // 👈 Definir en main.js
  return {
    userId: session.userId || 'anonymous',
    userRole: session.role || 'guest',
    action: global.currentAction || 'unknown'
  }
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    app: 'cerebro-legislativo',
    version: app.getVersion(),
    platform: process.platform,
    // 👇 Contexto dinámico se mergea en cada log
  },
  transports: [
    new winston.transports.File({ 
      filename: path.join(app.getPath('logs'), 'error.log'), 
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3 
    }),
    new winston.transports.File({ 
      filename: path.join(app.getPath('logs'), 'combined.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  ]
})

// Wrapper para logs con contexto explícito
export const logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    ...getDynamicMeta(),
    ...context,
    timestamp: new Date().toISOString()
  })
}

// En desarrollo: agregar consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

// electron/src/main.js (inicializar sesión global)
global.appSession = {
  userId: null,
  role: 'guest',
  // Se actualizará cuando el usuario inicie sesión
}

global.currentAction = 'app_start'
🔹 4.2 Health Check Endpoint
// electron/src/ipc/app.js (nuevo módulo o agregar a handlers existentes)
import { ipcMain, app } from 'electron'
import { db } from '../db/index.js'
import { logger } from '../lib/logger.js'

export const setupAppHandlers = () => {
  ipcMain.handle('app:health', async () => {
    const startTime = Date.now()
    
    try {
      // Verificar conexión a DB
      const dbCheck = db.prepare('SELECT 1 as ok').get()
      
      // Verificar espacio en disco (opcional pero útil)
      const diskUsage = process.platform === 'win32' 
        ? 'not-implemented' 
        : await getDiskUsage(app.getPath('userData'))
      
      return {
        status: 'ok',
        version: app.getVersion(),
        uptime: process.uptime(),
        db: dbCheck?.ok === 1 ? 'connected' : 'error',
        disk: diskUsage,
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime
      }
    } catch (error) {
      logger.error('Health check failed', { error: error.message })
      return {
        status: 'error',
        version: app.getVersion(),
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  })
}

// Helper opcional para verificar disco
const getDiskUsage = async (path) => {
  try {
    const { execSync } = await import('child_process')
    const output = execSync(`df -k "${path}" | tail -1`, { encoding: 'utf8' })
    const [, total, used, avail] = output.trim().split(/\s+/)
    return {
      total_kb: parseInt(total),
      used_kb: parseInt(used),
      available_kb: parseInt(avail),
      usage_percent: Math.round((parseInt(used) / parseInt(total)) * 100)
    }
  } catch {
    return 'not-available'
  }
}
// electron/src/ipc/handlers.js (registrar el nuevo handler)
import { setupAppHandlers } from './app.js'

export const setupIPCHandlers = () => {
  // ... otros handlers
  setupAppHandlers() // 👈 Agregar esta línea
}
5. Seguridad: Validación de Input en IPC
🔹 5.1 Patrón Básico (Sin dependencias)
// electron/src/ipc/laws.js
import { logger } from '../lib/logger.js'

export const handleSearchLaws = async (_, { term, filters = {} }) => {
  try {
    // 👇 Validación defensiva
    if (!term || typeof term !== 'string') {
      logger.warn('IPC:searchLaws - term inválido', { 
        term_type: typeof term,
        filters 
      })
      return { error: 'Término de búsqueda requerido' }
    }
    
    if (term.trim().length < 2) {
      logger.warn('IPC:searchLaws - term muy corto', { 
        term_length: term.length 
      })
      return { error: 'Término de búsqueda debe tener al menos 2 caracteres' }
    }
    
    if (term.length > 100) {
      logger.warn('IPC:searchLaws - term demasiado largo', { 
        term_length: term.length 
      })
      return { error: 'Término de búsqueda demasiado largo' }
    }
    
    // Sanitizar: eliminar caracteres peligrosos para SQL LIKE
    const sanitizedTerm = term.replace(/[%_\\]/g, '\\$&')
    
    // Validar filtros conocidos
    const allowedFilters = ['estado', 'fecha_desde', 'fecha_hasta', 'tipo']
    const unknownFilters = Object.keys(filters).filter(
      f => !allowedFilters.includes(f)
    )
    if (unknownFilters.length > 0) {
      logger.warn('IPC:searchLaws - filtros desconocidos', { unknownFilters })
      // No fallar, solo ignorar filtros desconocidos
    }
    
    // 👇 Ahora sí, consultar la DB
    const query = `
      SELECT id, expediente, titulo, fecha_publicacion, estado
      FROM leyes
      WHERE titulo LIKE ? OR expediente LIKE ?
      ${filters.estado ? 'AND estado = ?' : ''}
      ORDER BY fecha_publicacion DESC
      LIMIT 50
    `
    const params = [`%${sanitizedTerm}%`, `%${sanitizedTerm}%`]
    if (filters.estado) params.push(filters.estado)
    
    const results = await db.all(query, ...params)
    
    logger.info('IPC:searchLaws - búsqueda exitosa', {
      term_length: term.length,
      results_count: results.length,
      filters_applied: Object.keys(filters).length
    })
    
    return { success: true,  results }
    
  } catch (error) {
    logger.error('IPC:searchLaws - error inesperado', {
      error: error.message,
      stack: error.stack,
      context: { term, filters }
    })
    return { error: 'Error interno al buscar leyes' }
  }
}
🔹 5.2 Patrón Avanzado: Con Zod (Recomendado)

npm install zod

// electron/src/ipc/schemas/laws.js
import { z } from 'zod'

export const searchLawsSchema = z.object({
  term: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .refine(val => !/[<>{}]/.test(val), 'Caracteres no permitidos'),
  
  filters: z.object({
    estado: z.enum(['vigente', 'derogada', 'en_tramite']).optional(),
    fecha_desde: z.string().date().optional(),
    fecha_hasta: z.string().date().optional(),
    tipo: z.string().max(50).optional()
  }).optional().default({})
})

// Helper para validar y retornar error estandarizado
export const validateIPCInput = (schema, data, channel) => {
  try {
    return { success: true,  schema.parse(data) }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn(`IPC:${channel} - validación fallida`, {
        errors: error.errors.map(e => ({ path: e.path, message: e.message })),
        received: data
      })
      return { 
        success: false, 
        error: 'Datos inválidos', 
        details: error.errors.map(e => e.message) 
      }
    }
    throw error // Re-lanzar errores no esperados
  }
}

// electron/src/ipc/laws.js (con Zod)
import { searchLawsSchema, validateIPCInput } from './schemas/laws.js'

export const handleSearchLaws = async (_, rawData) => {
  // 👇 Validación centralizada con Zod
  const validation = validateIPCInput(searchLawsSchema, rawData, 'laws:search')
  if (!validation.success) {
    return { error: validation.error, details: validation.details }
  }
  
  const { term, filters } = validation.data
  
  try {
    // Sanitizar para SQL LIKE
    const sanitizedTerm = term.replace(/[%_\\]/g, '\\$&')
    
    // ... resto de la lógica de consulta (igual que antes)
    const results = await db.all(query, ...params)
    
    logger.info('IPC:searchLaws - búsqueda exitosa', {
      term_length: term.length,
      results_count: results.length
    })
    
    return { success: true,  results }
    
  } catch (error) {
    logger.error('IPC:searchLaws - error inesperado', { error: error.message })
    return { error: 'Error interno al buscar leyes' }
  }
}

🎯 Beneficios de Zod

    ✅ Validación declarativa y legible
    ✅ Tipos TypeScript inferidos automáticamente
    ✅ Mensajes de error personalizados
    ✅ Reutilizable en frontend (compartir schemas)


6. Calidad: Cobertura + Changelog Automático
🔹 6.1 Scripts de Cobertura
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:coverage:report": "npm run test:coverage && echo '📊 Reporte generado en coverage/index.html'",
    "test:coverage:ci": "vitest run --coverage --reporter=junit --outputFile.junit=coverage/junit.xml",
    "test:all": "npm run test && npm run test:e2e"
  },
  "vitest": {
    "coverage": {
      "provider": "v8",
      "reporter": ["text", "json", "html", "lcov"],
      "exclude": [
        "node_modules/**",
        "src/renderer/**",
        "**/*.config.js",
        "**/migrations/**"
      ],
      "thresholds": {
        "lines": 80,
        "branches": 70,
        "functions": 75,
        "statements": 80
      }
    }
  }
}
🔹 6.2 Changelog Automático con Conventional Commits
npm install -D conventional-changelog-cli commitlint @commitlint/config-conventional husky
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'
    ]],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'body-max-line-length': [2, 'always', 100]
  }
}
// package.json (agregar)
{
  "scripts": {
    "prepare": "husky install",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s -r 0",
    "release:changelog": "npm run changelog && git add CHANGELOG.md && git commit -m \"docs: update changelog\" --no-verify"
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
# Configurar husky
npx husky-init && npm install
npx husky add .husky/commit-msg 'npx commitlint --edit $1'

# .github/workflows/release.yml (fragmento para changelog)
- name: 📝 Generate changelog
  run: npm run changelog
  
- name: 📤 Create GitHub Release
  uses: softprops/action-gh-release@v1
  with:
    body_path: CHANGELOG.md
    files: dist/*
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  # 1. Hacer commits con mensajes convencionales:
git commit -m "feat(laws): add fuzzy search for legislation titles"
git commit -m "fix(ipc): validate input in searchLaws handler"

# 2. Taggear nueva versión:
git tag v1.3.0

# 3. Generar changelog:
npm run release:changelog

# 4. Push con tags:
git push origin main --tags

# 5. GitHub Actions: build + publish automático 🚀
7. Distribución: Releases Automáticos + Package Managers
🔹 7.1 Workflow de Release con electron-builder
# .github/workflows/release.yml (completo)
name: Release

on:
  push:
    tags: ['v*.*.*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Versión a publicar (ej: v1.3.0)'
        required: true
        type: string

permissions:
  contents: write
  packages: write

env:
  ELECTRON_BUILDER_VERSION: '24.13.3'
  NODE_VERSION: '20'

jobs:
  release:
    strategy:
      matrix:
        include:
          - os: ubuntu-latest
            target: linux
            artifact_ext: '.AppImage'
          - os: windows-latest
            target: win
            artifact_ext: '.exe'
          - os: macos-latest
            target: mac
            artifact_ext: '.dmg'
            # macOS requiere signing: configurar secrets APPLE_ID, etc.
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Para changelog
      
      - uses: ./.github/actions/setup-node  # Reusable action
      
      - name: 🔨 Build Electron app
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing (opcional):
          # CSC_LINK: ${{ secrets.CSC_LINK }}
          # CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
        run: npm run build:${{ matrix.target }} -- --publish always
        
      - name: 📦 Upload artifacts to Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*${{ matrix.artifact_ext }}
          body_path: CHANGELOG.md
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Job opcional: Publicar en winget/chocolatey (Windows)
  publish-windows-packages:
    needs: release
    runs-on: windows-latest
    if: ${{ !contains(github.ref, 'beta') }}  # Solo en releases estables
    steps:
      - name: 🪟 Publish to WinGet
        uses: vedantmgoyal2009/winget-releaser@main
        with:
          identifier: JoseAMorenoC025.CerebroLegislativo
          version: ${{ github.ref_name }}
          installers-regex: '\.exe$'
          token: ${{ secrets.WINGET_TOKEN }}
          
      - name: 🍫 Publish to Chocolatey (opcional)
        # Requiere paquete chocolatey/nuspec configurado
        run: echo "Chocolatey publishing pendiente de configuración"
        // electron-builder.yml o package.json.build
{
  "appId": "com.cerebrolegislativo.app",
  "productName": "Cerebro Legislativo",
  "directories": {
    "output": "dist",
    "buildResources": "resources"
  },
  "files": [
    "electron/**/*",
    "dist/**/*",
    "package.json",
    "!**/node_modules/*/{CHANGELOG.md,README.md,readme.md}"
  ],
  "win": {
    "target": ["nsis", "portable"],
    "artifactName": "${productName}-${version}-win.${ext}",
    "icon": "resources/icon.ico"
  },
  "mac": {
    "target": ["dmg", "zip"],
    "artifactName": "${productName}-${version}-mac.${ext}",
    "icon": "resources/icon.icns",
    "category": "public.app-category.productivity"
  },
  "linux": {
    "target": ["AppImage", "deb"],
    "artifactName": "${productName}-${version}-linux.${ext}",
    "icon": "resources/icon.png",
    "category": "Office",
    "desktop": {
      "Name": "Cerebro Legislativo",
      "Comment": "Análisis y gestión de legislación"
    }
  },
  "publish": {
    "provider": "github",
    "owner": "joseamorenoc025",
    "repo": "cerebro_legislativo",
    "releaseType": "release"
  }
}

8. Analytics: Métricas Anónimas Opt-in
🔹 Implementación Ética y Privada
// electron/src/lib/analytics.js
import { logger } from './logger.js'
import { app } from 'electron'

// Configuración global (se inicializa en main.js)
export const analyticsConfig = {
  enabled: false,  // Default: OFF por privacidad
  endpoint: null,  // URL opcional para envío remoto
  sessionId: null  // UUID anónimo por sesión
}

// Helper para generar ID anónimo (sin PII)
const generateAnonymousId = () => {
  return 'anon_' + Math.random().toString(36).substring(2, 10) + 
         '_' + Date.now().toString(36)
}

// Función principal para registrar eventos
export const trackEvent = (eventName, properties = {}) => {
  // 👇 Respetar configuración de usuario
  if (!analyticsConfig.enabled) return
  
  // 👇 Nunca incluir datos personales
  const sanitizedProps = Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      // Excluir campos sensibles
      const blockedKeys = ['userId', 'email', 'token', 'password', 'ip']
      return !blockedKeys.includes(key.toLowerCase())
    })
  )
  
  const payload = {
    event: eventName,
    properties: sanitizedProps,
    context: {
      app: 'cerebro-legislativo',
      version: app.getVersion(),
      platform: process.platform,
      session_id: analyticsConfig.sessionId,
      timestamp: new Date().toISOString()
    }
  }
  
  // 👇 Log local (siempre disponible)
  logger.info('analytics:event', payload)
  
  // 👇 Envío remoto opcional (si endpoint configurado)
  if (analyticsConfig.endpoint) {
    sendToEndpoint(payload).catch(err => {
      logger.warn('analytics:send_failed', { error: err.message })
    })
  }
}

// Envío asíncrono a endpoint remoto (opcional)
const sendToEndpoint = async (payload) => {
  // Implementar con fetch o axios
  // Considerar: retries, timeout, offline queue
}

// Eventos recomendados para tracking
export const ANALYTICS_EVENTS = {
  APP_START: 'app_start',
  LAW_SEARCH: 'law_search',
  LAW_VIEW: 'law_view',
  EXPORT_PDF: 'export_pdf',
  FEATURE_USED: 'feature_used',
  ERROR_ENCOUNTERED: 'error_encountered'
}
// electron/src/main.js (inicialización)
import { analyticsConfig, generateAnonymousId } from './lib/analytics.js'

// Al iniciar la app
analyticsConfig.sessionId = generateAnonymousId()

// Leer preferencia de usuario desde settings persistentes
const userSettings = loadUserSettings() // Tu función existente
analyticsConfig.enabled = userSettings.allowAnalytics || false

// 👇 IPC para que el frontend pueda actualizar preferencias
ipcMain.handle('analytics:update-preferences', (_, prefs) => {
  analyticsConfig.enabled = prefs.allowAnalytics === true
  saveUserSettings({ allowAnalytics: prefs.allowAnalytics })
  logger.info('analytics:preferences_updated', { enabled: analyticsConfig.enabled })
  return { success: true }
})
// Ejemplo de uso en un handler IPC
import { trackEvent, ANALYTICS_EVENTS } from '../lib/analytics.js'

export const handleSearchLaws = async (_, { term, filters }) => {
  const startTime = Date.now()
  
  try {
    // ... lógica de búsqueda ...
    
    // 👇 Tracking anónimo del evento
    trackEvent(ANALYTICS_EVENTS.LAW_SEARCH, {
      term_length: term.length,
      filters_count: Object.keys(filters || {}).length,
      results_count: results?.length || 0,
      duration_ms: Date.now() - startTime
    })
    
    return { success: true,  results }
  } catch (error) {
    trackEvent(ANALYTICS_EVENTS.ERROR_ENCOUNTERED, {
      feature: 'law_search',
      error_type: error.name
    })
    throw error
  }
}
🎯 Principios Éticos

    ✅ Opt-in por defecto: El usuario debe activar explícitamente
    ✅ Sin PII: Nunca enviar nombres, emails, IPs, tokens
    ✅ Transparencia: Documentar qué se recoge en ARCHITECTURE.md
    ✅ Control: Permitir desactivar en cualquier momento
    ✅ Local-first: Logs locales siempre disponibles, envío remoto opcional

    9. Arquitectura: Sistema de Plugins
🔹 ¿Por qué un Sistema de Plugins?

PROBLEMAS QUE RESUELVE:
✅ Extensibilidad sin modificar código core
✅ Colaboración: terceros pueden aportar features
✅ Mantenibilidad: módulos aislados, tests independientes
✅ Personalización: usuarios/organizaciones activan solo lo que necesitan

CASOS DE USO PARA cerebros_legislativo:
• Plugin de exportación: PDF, Word, Markdown, JSON-LD
• Plugin de análisis: NLP básico, detección de temas, similitud entre leyes
• Plugin de fuentes: Conectores a portales legislativos específicos (México, Colombia, España...)
• Plugin de IA: Integración con modelos locales/remotos para resumen, clasificación
• Plugin de UI: Temas personalizados, layouts alternativos, widgets de dashboard

🔹 Diseño Mínimo Viable de Plugin System
// electron/src/plugins/pluginManager.js
import path from 'path'
import { app } from 'electron'
import { logger } from '../lib/logger.js'

export class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.hooks = {
      'app:ready': [],
      'law:search': [],
      'law:view': [],
      'export:generate': []
    }
  }
  
  // Registrar un plugin
  register(plugin) {
    if (!plugin.id || !plugin.version) {
      throw new Error('Plugin debe tener id y version')
    }
    
    if (this.plugins.has(plugin.id)) {
      logger.warn(`Plugin ${plugin.id} ya registrado, ignorando`)
      return
    }
    
    // Validar API mínima del plugin
    if (typeof plugin.activate !== 'function') {
      throw new Error(`Plugin ${plugin.id} debe implementar activate()`)
    }
    
    // Registrar hooks que el plugin proporciona
    if (plugin.hooks) {
      for (const [hookName, handler] of Object.entries(plugin.hooks)) {
        if (this.hooks[hookName]) {
          this.hooks[hookName].push({ pluginId: plugin.id, handler })
          logger.debug(`Plugin ${plugin.id} registered hook: ${hookName}`)
        }
      }
    }
    
    // Activar plugin
    plugin.activate({
      ipc: { register: (channel, handler) => {/* registrar en ipcMain */} },
      db: { query: (sql, params) => {/* wrapper seguro a db */} },
      logger,
      config: { get: (key) => {/* leer config de usuario */} }
    })
    
    this.plugins.set(plugin.id, plugin)
    logger.info(`Plugin registrado: ${plugin.id}@${plugin.version}`)
  }
  
  // Ejecutar hooks (patrón observer)
  async emit(hookName, data) {
    if (!this.hooks[hookName]) return data
    
    let result = data
    for (const { pluginId, handler } of this.hooks[hookName]) {
      try {
        result = await handler(result, { pluginManager: this })
        logger.debug(`Hook ${hookName} ejecutado por ${pluginId}`)
      } catch (error) {
        logger.error(`Hook ${hookName} falló en plugin ${pluginId}`, { error: error.message })
        // No propagar error: un plugin no debe romper el core
      }
    }
    return result
  }
  
  // Listar plugins activos
  list() {
    return Array.from(this.plugins.values()).map(p => ({
      id: p.id,
      version: p.version,
      description: p.description
    }))
  }
}

// Instancia global
export const pluginManager = new PluginManager()

🔹 Ejemplo de Plugin: Exportación a PDF Avanzada

// plugins/export-pdf-advanced/index.js
export default {
  id: 'export-pdf-advanced',
  version: '1.0.0',
  description: 'Exportación a PDF con metadatos legislativos y marca de agua',
  
  activate({ ipc, db, logger, config }) {
    // Registrar nuevo canal IPC para el plugin
    ipc.register('export:pdf:advanced', async (_, { lawId, options }) => {
      try {
        const law = await db.query('SELECT * FROM leyes WHERE id = ?', [lawId])
        if (!law) return { error: 'Ley no encontrada' }
        
        // 👇 Hook: permitir que otros plugins modifiquen los datos antes de exportar
        const enrichedLaw = await pluginManager.emit('law:beforeExport', law)
        
        // Generar PDF con pdf-lib o similar
        const pdfBuffer = await generateAdvancedPDF(enrichedLaw, {
          watermark: config.get('pdf.watermark') || false,
          includeMeta options?.includeMetadata ?? true,
          theme: options?.theme || 'default'
        })
        
        return { success: true, data: pdfBuffer }
      } catch (error) {
        logger.error('Plugin export-pdf-advanced failed', { error: error.message })
        return { error: 'Error generando PDF avanzado' }
      }
    })
    
    logger.info('Plugin export-pdf-advanced activado')
  },
  
  // Hooks que este plugin proporciona
  hooks: {
    'export:generate': async (result, { pluginManager }) => {
      // Si el resultado es para exportación, agregar metadatos adicionales
      if (result.format === 'pdf') {
        result.metadata = {
          ...result.metadata,
          generatedBy: 'export-pdf-advanced@1.0.0',
          timestamp: new Date().toISOString()
        }
      }
      return result
    }
  }
}
🔹 Cargar Plugins Dinámicamente
// electron/src/main.js (fragmento)
import { pluginManager } from './plugins/pluginManager.js'
import path from 'path'
import { app } from 'electron'

const loadPlugins = async () => {
  const pluginsPath = path.join(app.getPath('userData'), 'plugins')
  
  // Cargar plugins del directorio de usuario (prioridad)
  await loadPluginsFromPath(pluginsPath)
  
  // Cargar plugins embebidos (core)
  await loadPluginsFromPath(path.join(app.getAppPath(), 'plugins'))
}

const loadPluginsFromPath = async (basePath) => {
  try {
    const { readdir, stat } = await import('fs/promises')
    const entries = await readdir(basePath, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(basePath, entry.name, 'index.js')
        try {
          const plugin = await import(`file://${pluginPath}`)
          pluginManager.register(plugin.default)
        } catch (error) {
          logger.warn(`No se pudo cargar plugin en ${entry.name}`, { error: error.message })
        }
      }
    }
  } catch (error) {
    // Directorio no existe o no es legible: no es error crítico
    logger.debug('No se pudieron cargar plugins', { path: basePath })
  }
}

// Ejecutar después de app ready
app.whenReady().then(async () => {
  await loadPlugins()
  // ... resto de inicialización
})
🔹 Estructura de Directorios Recomendada

cerebro_legislativo/
├── electron/
│   ├── src/
│   │   ├── plugins/
│   │   │   ├── pluginManager.js    # Core del sistema de plugins
│   │   │   └── types.d.ts          # Tipos TypeScript para plugins
│   │   └── ...
│   └── ...
├── plugins/                          # Plugins embebidos (core)
│   ├── export-pdf-advanced/
│   │   ├── index.js
│   │   ├── package.json
│   │   └── README.md
│   ├── source-mexico-congress/
│   │   └── ...
│   └── ai-summarizer-local/
│       └── ...
├── docs/
│   ├── PLUGIN_DEVELOPMENT.md        # Guía para desarrolladores de plugins
│   └── PLUGIN_API.md                # Documentación de la API de plugins
└── ...

10. IA: Análisis de Texto Legislativo
🔹 Oportunidades de IA en el Dominio Legislativo

CASOS DE USO VIABLES (2026):
✅ Clasificación automática de leyes por tema (salud, educación, economía...)
✅ Detección de similitud entre proyectos de ley (evitar duplicación)
✅ Resumen automático de artículos largos (extractivo, no generativo)
✅ Extracción de entidades: fechas, montos, instituciones mencionadas
✅ Búsqueda semántica: "leyes sobre protección de datos" ≠ búsqueda por palabras clave

ENFOQUE RECOMENDADO: Local-first + Privacidad
• Modelos pequeños ejecutados localmente (transformers.js, ONNX)
• Sin envío de texto legislativo a APIs externas por defecto
• Opt-in para features que requieran modelos grandes (cloud)

🔹 Implementación MVP: Búsqueda Semántica Local
# Dependencias
npm install @xenova/transformers @huggingface/inference

// electron/src/lib/ai/semanticSearch.js
import { pipeline, env } from '@xenova/transformers'
import { logger } from '../logger.js'

// Configurar transformers.js para ejecución local
env.allowLocalModels = true
env.useBrowserCache = false

class SemanticSearchEngine {
  constructor() {
    this.extractor = null
    this.initialized = false
  }
  
  async initialize(modelName = 'Xenova/all-MiniLM-L6-v2') {
    if (this.initialized) return
    
    try {
      logger.info('Cargando modelo de embeddings...', { model: modelName })
      this.extractor = await pipeline('feature-extraction', modelName, {
        quantized: true,  // Modelo cuantizado para menor tamaño
        progress_callback: (progress) => {
          logger.debug('Carga del modelo', { progress })
        }
      })
      this.initialized = true
      logger.info('✅ Modelo de embeddings listo')
    } catch (error) {
      logger.error('❌ Error cargando modelo de IA', { error: error.message })
      // Fallback: usar búsqueda textual tradicional
      this.initialized = false
    }
  }
  
  async getEmbedding(text) {
    if (!this.initialized || !this.extractor) {
      throw new Error('SemanticSearchEngine no inicializado')
    }
    
    // Generar embedding (vector de ~384 dimensiones para MiniLM)
    const output = await this.extractor(text, {
      pooling: 'mean',
      normalize: true
    })
    
    // Convertir a array plano de números
    return Array.from(output.data)
  }
  
  // Búsqueda por similitud coseno
  async search(query, documents, topK = 10) {
    if (!this.initialized) {
      // Fallback a búsqueda textual
      logger.debug('Fallback a búsqueda textual')
      return this.textSearchFallback(query, documents, topK)
    }
    
    const queryEmbedding = await this.getEmbedding(query)
    
    // Calcular similitud coseno con cada documento
    const scored = documents.map(doc => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding)
      return { ...doc, score: similarity }
    })
    
    // Ordenar por score descendente y retornar top K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ score, ...doc }) => doc) // Remover score interno si no se necesita
  }
  
  // Fallback simple: búsqueda por palabras clave
  textSearchFallback(query, documents, topK) {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    return documents
      .map(doc => {
        const text = `${doc.titulo} ${doc.contenido?.substring(0, 500) || ''}`.toLowerCase()
        const matches = terms.filter(term => text.includes(term)).length
        return { ...doc, score: matches / terms.length }
      })
      .filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }
}

// Helper: similitud coseno entre dos vectores
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return normA === 0 || normB === 0 ? 0 : dot / (normA * normB)
}

export const semanticSearch = new SemanticSearchEngine()

🔹 Pre-computar Embeddings para Leyes Existentes

// scripts/generate-embeddings.js (script de mantenimiento)
import { db } from '../electron/src/db/index.js'
import { semanticSearch } from '../electron/src/lib/ai/semanticSearch.js'
import { logger } from '../electron/src/lib/logger.js'

const generateEmbeddingsForLaws = async () => {
  await semanticSearch.initialize()
  if (!semanticSearch.initialized) {
    logger.error('No se pudo inicializar IA, saliendo')
    process.exit(1)
  }
  
  const laws = await db.all('SELECT id, titulo, contenido FROM leyes')
  logger.info(`Procesando ${laws.length} leyes...`)
  
  for (const law of laws) {
    try {
      // Combinar título + primer párrafo para embedding representativo
      const text = `${law.titulo}. ${law.contenido?.substring(0, 300) || ''}`
      const embedding = await semanticSearch.getEmbedding(text)
      
      // Guardar en columna nueva (agregar con migración primero)
      await db.run(
        'UPDATE leyes SET embedding = ? WHERE id = ?',
        [JSON.stringify(embedding), law.id]
      )
      
      if (laws.indexOf(law) % 10 === 0) {
        logger.info(`Progreso: ${laws.indexOf(law) + 1}/${laws.length}`)
      }
    } catch (error) {
      logger.warn(`Error procesando ley ${law.id}`, { error: error.message })
    }
  }
  
  logger.info('✅ Embeddings generados exitosamente')
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  generateEmbeddingsForLaws().catch(console.error)
}

🎯 Consideraciones de Rendimiento
• Modelo MiniLM-L6-v2: ~80MB cuantizado, ~2-3GB RAM en uso
• Embedding por ley: ~1-2 segundos en CPU moderna
• Búsqueda semántica: O(n) con pre-computación, viable hasta ~10K leyes
• Para escalar: considerar FAISS o similar para búsqueda vectorial eficiente

RECOMENDACIÓN MVP:
1. Implementar búsqueda textual tradicional (ya hecho ✅)
2. Agregar columna `embedding` en schema de leyes (migración)
3. Script para generar embeddings en background (no bloquear UI)
4. Feature flag para activar búsqueda semántica: `config.ai.enabled`
5. Fallback automático a búsqueda textual si IA no está disponible

11. Amenazas: Mitigación de Riesgos
🔹 11.1 Breaking Changes en Dependencias
# .github/dependabot.yml (configurar actualizaciones automáticas)
version: 2
updates:
  # Actualizaciones de npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    versioning-strategy: "increase"
    groups:
      electron-deps:
        patterns:
          - "electron"
          - "@electron/*"
      testing-deps:
        patterns:
          - "vitest"
          - "@vitest/*"
          - "@playwright/*"
    
  # Actualizaciones de GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

    // scripts/dependency-audit.js (script de verificación pre-release)
import { execSync } from 'child_process'
import { logger } from '../electron/src/lib/logger.js'

const runAudit = () => {
  try {
    // Verificar vulnerabilidades
    const audit = execSync('npm audit --json', { encoding: 'utf8' })
    const report = JSON.parse(audit)
    
    if (report.metadata.vulnerabilities.total > 0) {
      const { critical, high, moderate, low } = report.metadata.vulnerabilities
      logger.warn('🔍 Vulnerabilidades encontradas', { critical, high, moderate, low })
      
      if (critical > 0 || high > 0) {
        logger.error('❌ Vulnerabilidades críticas/altas: deteniendo release')
        process.exit(1)
      }
    } else {
      logger.info('✅ Sin vulnerabilidades conocidas')
    }
    
    // Verificar versiones de Electron y Drizzle
    const pkg = JSON.parse(execSync('npm pkg get dependencies devDependencies', { encoding: 'utf8' }))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    
    const criticalDeps = ['electron', 'drizzle-orm', 'drizzle-kit']
    for (const dep of criticalDeps) {
      if (deps[dep]?.includes('^') || deps[dep]?.includes('~')) {
        logger.warn(`⚠️ ${dep} usa version range: considerar pinning para estabilidad`)
      }
    }
    
  } catch (error) {
    logger.error('Error ejecutando audit', { error: error.message })
    process.exit(1)
  }
}

export { runAudit }

🔹 11.2 Estrategia de Pinning de Versiones

// package.json (ejemplo de versionamiento conservador)
{
  "dependencies": {
    "electron": "28.2.0",           // 👈 Versión exacta, no ^28.0.0
    "drizzle-orm": "0.29.3",
    "better-sqlite3": "9.4.3",
    "winston": "3.11.0",
    "zod": "3.22.4"
  },
  "devDependencies": {
    "vitest": "1.2.2",
    "@playwright/test": "1.41.0",
    "drizzle-kit": "0.20.14",
    "electron-builder": "24.13.3"
  }
}

# Script para actualizar dependencias de forma controlada
# scripts/update-deps-safe.js
{
  "scripts": {
    "deps:check": "npm outdated --long",
    "deps:update:minor": "npm update --save --save-dev",  # Solo patch/minor
    "deps:update:major": "npm install electron@latest drizzle-orm@latest --save",  # Manual review
    "deps:audit:fix": "npm audit fix --dry-run"  # Ver antes de aplicar
  }
}

🔹 11.3 Plan de Respuesta a Breaking Changes

# docs/BREAKING_CHANGES_RESPONSE.md

## Cuando una dependencia crítica tiene breaking change:

1. **NO actualizar inmediatamente en main**
2. Crear rama `spike/dependency-name-vX`
3. Ejecutar tests completos: `npm run test:all`
4. Verificar builds multi-plataforma: `npm run build:all`
5. Documentar cambios necesarios en `docs/MIGRATION_GUIDE.md`
6. Si es viable: crear PR con:
   - [ ] Tests actualizados
   - [ ] Documentación de migración
   - [ ] Notas de release claras
7. Si NO es viable: mantener versión anterior + plan de refactor a mediano plazo

## Comunicación con usuarios:
- Anunciar cambios breaking en CHANGELOG.md con sección "⚠️ Breaking Changes"
- Proveir script de migración si aplica: `npm run migrate:v2`
- Mantener compatibilidad hacia atrás por 1 versión menor cuando sea posible

- 12. Roadmap: Biblioteca de Leyes MVP
🔹 Estado Actual (según ARCHITECTURE.md)

⏳ Leyes (Biblioteca) - Pendiente integración PDF/Drive

🔹 Plan de Implementación por Fases
Fase 1: MVP Funcional (2-3 semanas)
✅ OBJETIVO: Búsqueda y visualización básica de leyes desde archivos locales

TAREAS:
□ Migración DB: Agregar columnas `file_path`, `file_hash`, `parsed_at`
□ Servicio: `FileIngestor` para importar PDFs/DOCX a texto plano
□ IPC: `laws:import` para importar archivo desde UI
□ UI: Vista de lista de leyes importadas + vista de detalle
□ Búsqueda: Integrar con búsqueda textual existente
□ Tests: Unitarios para FileIngestor, integración para IPC import

CRITERIOS DE ACEPTACIÓN:
• Usuario puede importar un PDF de ley desde la UI
• El texto es extraído y almacenado en DB
• La ley aparece en búsquedas por título/expediente
• Se puede ver el contenido completo en la app

Fase 2: Mejoras de UX (1-2 semanas)
✅ OBJETIVO: Experiencia de lectura y organización

TAREAS:
□ UI: Viewer de texto con resaltado de términos de búsqueda
□ UI: Sistema de etiquetas/categorías para leyes
□ IPC: `laws:tag` para asignar/quitar etiquetas
□ Persistencia: Guardar preferencias de vista (tamaño de fuente, tema)
□ Export: Botón para exportar ley actual a TXT/MD

CRITERIOS DE ACEPTACIÓN:
• Usuario puede leer leyes con buena legibilidad
• Puede organizar leyes con etiquetas personales
• Preferencias de visualización se mantienen entre sesiones

Fase 3: Integración de Fuentes Externas (2-3 semanas)
✅ OBJETIVO: Conectar con portales legislativos oficiales

TAREAS:
□ Arquitectura: `SourceAdapter` interface para fuentes externas
□ Plugin: `source-mexico-dof` para Diario Oficial de la Federación
□ Servicio: `SyncScheduler` para actualizaciones periódicas (opt-in)
□ UI: Configuración de fuentes activas + frecuencia de sync
□ Conflictos: Estrategia para leyes duplicadas (hash-based deduplication)

CRITERIOS DE ACEPTACIÓN:
• Usuario puede activar sincronización con DOF México
• Nuevas leyes se importan automáticamente (si el usuario acepta)
• No se duplican leyes ya existentes (detección por hash de contenido)

Fase 4: Features Avanzadas (roadmap posterior)
🔜 OBJETIVO: Diferenciación competitiva

IDEAS:
• Búsqueda semántica con embeddings (ver sección 10)
• Comparador de versiones de una misma ley a través del tiempo
• Timeline visual de tramitación legislativa
• Alertas: notificar cuando se publique ley sobre tema de interés
• Colaboración: compartir colecciones de leyes con otros usuarios (P2P o cloud opt-in)
🔹 Estructura de Código Sugerida para Fase 1
electron/src/
├── services/
│   ├── fileIngestor.js          # Extraer texto de PDF/DOCX
│   ├── lawImporter.js           # Orquestar importación a DB
│   └── textExtractor/
│       ├── pdfExtractor.js      # Usar pdf-parse o similar
│       └── docxExtractor.js     # Usar mammoth o similar
├── ipc/
│   ├── laws.js                  # Handlers: import, list, get, search
│   └── schemas/laws.js          # Zod schemas para validación
├── db/
│   ├── schema.js                # Agregar tabla `law_files` si es necesario
│   └── migrations/
│       └── 0001_add_law_files.sql
└── lib/
    └── fileUtils.js             # Helpers: hash, path validation, etc.
    // electron/src/services/fileIngestor.js (ejemplo)
import { logger } from '../lib/logger.js'
import { extractTextFromPDF } from './textExtractor/pdfExtractor.js'
import { hashContent } from '../lib/fileUtils.js'

export const ingestLawFile = async (filePath, metadata = {}) => {
  try {
    // Validar archivo
    if (!filePath || !filePath.endsWith('.pdf')) {
      throw new Error('Solo se soportan archivos PDF por ahora')
    }
    
    // Extraer texto
    logger.info('Extrayendo texto de PDF', { path: filePath })
    const content = await extractTextFromPDF(filePath)
    
    if (!content || content.length < 50) {
      throw new Error('No se pudo extraer contenido válido del PDF')
    }
    
    // Generar hash para deduplicación
    const contentHash = hashContent(content)
    
    // Preparar datos para DB
    const lawData = {
      expediente: metadata.expediente || null,
      titulo: metadata.titulo || extractTitleFromContent(content),
      contenido: content,
      content_hash: contentHash,
      source_file: filePath,
      imported_at: new Date().toISOString(),
      ...metadata
    }
    
    logger.info('Ley procesada exitosamente', {
      title: lawData.titulo,
      content_length: content.length,
      hash: contentHash.substring(0, 12)
    })
    
    return { success: true,  lawData }
    
  } catch (error) {
    logger.error('Error ingiriendo archivo de ley', {
      path: filePath,
      error: error.message
    })
    return { success: false, error: error.message }
  }
}
13. Open Source: Plan de Publicación
🔹 Checklist Pre-Lanzamiento OSS
# docs/OPEN_SOURCE_CHECKLIST.md

## Legal y Licenciamiento
□ Seleccionar licencia: MIT (permisiva) o GPL-3.0 (copyleft) para proyecto cívico
□ Agregar archivo LICENSE en raíz del repo
□ Revisar dependencias: ¿todas tienen licencias compatibles?
□ Agregar NOTICE si se incluyen componentes con atribución requerida

## Documentación Pública
□ README.md: Descripción clara, screenshots, instalación rápida
□ CONTRIBUTING.md: Guía para nuevos colaboradores (issues, PRs, código)
□ CODE_OF_CONDUCT.md: Adoptar Contributor Covenant o similar
□ ARCHITECTURE.md: Ya existe ✅, verificar que esté actualizado
□ docs/PLUGIN_DEVELOPMENT.md: Para extensibilidad comunitaria

## Infraestructura Comunitaria
□ Habilitar Discussions en GitHub para preguntas y propuestas
□ Configurar Issue Templates: bug report, feature request, question
□ Configurar PR Template: checklist de calidad antes de merge
□ Agregar badge de "buscando colaboradores" en README

## Calidad y Confianza
□ CI/CD público: GitHub Actions visible para todos
□ Badges en README: build status, coverage, license, version
□ Releases con changelog automático y artifacts descargables
□ Security policy: docs/SECURITY.md para reporte responsable de vulnerabilidades

## Primeros Pasos para Contribuidores
□ Etiquetar issues con `good first issue` y `help wanted`
□ Documentar entorno de desarrollo: `docs/DEVELOPMENT.md`
□ Proveer script de setup: `npm run setup:dev` que instale deps + seed DB
□ Crear ejemplo de plugin mínimo en `examples/hello-world-plugin/`
🔹 Estructura de README.md Optimizada para OSS
# Cerebro Legislativo 🏛️

> Herramienta desktop para análisis, búsqueda y gestión de legislación. 
> Offline-first, privacidad por diseño, extensible con plugins.

[![Build Status](https://github.com/joseamorenoc025/cerebro_legislativo/actions/workflows/ci.yml/badge.svg)](https://github.com/joseamorenoc025/cerebro_legislativo/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/release/joseamorenoc025/cerebro_legislativo.svg)](https://github.com/joseamorenoc025/cerebro_legislativo/releases)

## ✨ Características

- 🔍 Búsqueda rápida con Command Palette (Ctrl+K)
- 📚 Biblioteca de leyes con importación de PDFs
- 🏷️ Organización con etiquetas y categorías personales
- 🌓 Dark mode + accesibilidad
- 🔒 Offline-first: tus datos, tu máquina
- 🔌 Extensible con plugins comunitarios

## 🚀 Instalación Rápida

### Desde Releases (Recomendado)
1. Ve a [Releases](https://github.com/joseamorenoc025/cerebro_legislativo/releases)
2. Descarga el instalador para tu sistema:
   - Windows: `Cerebro-Legislativo-x.x.x-win.exe`
   - macOS: `Cerebro-Legislativo-x.x.x-mac.dmg`
   - Linux: `Cerebro-Legislativo-x.x.x-linux.AppImage`
3. Ejecuta el instalador y listo 🎉

### Desde Código (Desarrollo)
```bash
git clone https://github.com/joseamorenoc025/cerebro_legislativo.git
cd cerebro_legislativo
npm run setup:dev  # Instala deps + configura entorno
npm run dev        # Inicia en modo desarrollo

🤝 Contribuir
¡Las contribuciones son bienvenidas! 

    Lee CONTRIBUTING.md
    Revisa issues con good first issue
    Haz fork, crea una rama, y abre un PR

¿Preguntas? Únete a las Discussions
.
📚 Documentación

    Arquitectura del Proyecto
    Guía de Desarrollo de Plugins
    Configuración de Entorno
    Changelog

🛡️ Privacidad y Seguridad

    ✅ No envía datos a servidores externos por defecto
    ✅ Analytics es opt-in y anónimo (ver detalles
    )
    ✅ Reporta vulnerabilidades de forma responsable: SECURITY.md

📄 Licencia
MIT © 2024 José A. Moreno. Ver LICENSE
 para detalles.


### 🔹 Estrategia de Lanzamiento OSS

```markdown
# docs/OSS_LAUNCH_PLAN.md

## Fase 0: Preparación (Semana 1)
□ Completar checklist de docs y legal
□ Limpiar repo: remover secrets, datos de prueba, TODOs sensibles
□ Ejecutar `npm run lint && npm run test:all` y asegurar 0 errores
□ Generar release candidate: `v1.0.0-rc.1`

## Fase 1: Soft Launch (Semana 2)
□ Publicar v1.0.0-rc.1 como pre-release en GitHub
□ Compartir con círculo cercano: colegas, comunidades cívico-tech
□ Recoger feedback temprano: bugs, UX, documentación
□ Iterar rápido: parches rc.2, rc.3 según sea necesario

## Fase 2: Lanzamiento Público (Semana 3-4)
□ Publicar v1.0.0 estable con changelog completo
□ Anunciar en:
   - Twitter/LinkedIn con hilo técnico (qué, por qué, cómo contribuir)
   - Comunidades: Reddit r/opensource, Hacker News, foros legislativos
   - Newsletters cívico-tech: CivicTechMX, GovTech LATAM
□ Preparar demo video de 2-3 min (pantalla + voz) para YouTube

## Fase 3: Crecimiento Comunitario (Semana 5+)
□ Responder rápido a issues y PRs (objetivo: <48h para primeros comentarios)
□ Reconocer contribuidores: agregar sección "Contributors" en README
□ Crear programa de "Plugin of the Month" para incentivar extensiones
□ Considerar organización GitHub: `@cerebro-legislativo` para escalar

14. Checklist Final: Ruta al 10/10
🔹 Nivel Actual: 8.7/10 → Objetivo: 10/10

# docs/ROADMAP_10_10.md

## ✅ Ya Implementado (Base Sólida)
- [x] Arquitectura Electron bien estructurada
- [x] Drizzle ORM con migraciones versionadas
- [x] Testing con Vitest (unitarios + componentes)
- [x] Logging estructurado con Winston
- [x] CI/CD con GitHub Actions (multi-plataforma)
- [x] Documentación de arquitectura (ARCHITECTURE.md)
- [x] UX moderna: Command Palette, Dark Mode, Tailwind

## 🔄 En Progreso (Próximas 2-4 semanas)
- [x] Validación de input en IPC con Zod
- [x] Tests de integración para IPC handlers
- [x] Health check endpoint para monitoreo
- [x] Scripts de cobertura de tests + thresholds
- [x] Changelog automático con Conventional Commits
- [ ] Releases automáticos con electron-builder
- [ ] Sistema de plugins mínimo viable

## 🎯 Para Alcanzar 10/10 (1-2 meses)
- [ ] E2E tests con Playwright para flujos críticos
- [ ] Búsqueda semántica opcional con transformers.js
- [ ] Publicación en winget/chocolatey (Windows)
- [x] Analytics anónimo opt-in con controles de privacidad
- [ ] Documentación completa para colaboradores OSS
- [ ] Primeros plugins comunitarios de ejemplo
- [ ] Plan de respuesta a breaking changes documentado

## 🏆 Indicadores de Éxito 10/10
□ Cobertura de tests >85% en main process
□ CI/CD: <10 min para pipeline completo, 100% confiable
□ Releases: automáticos, con changelog y artifacts firmados
□ Comunidad: al menos 3 contribuidores externos, 5 plugins comunitarios
□ Estabilidad: <1 bug crítico reportado por mes en producción
□ Documentación: nuevo desarrollador puede contribuir en <1 día

🔹 Flujo de Trabajo Semanal Recomendado
# docs/WEEKLY_WORKFLOW.md

## Lunes: Planning y Calidad
□ Revisar issues/PRs de la semana anterior
□ Definir 1-2 "right-sized stories" para la semana
□ Ejecutar `npm run test:coverage:report` y revisar thresholds
□ Actualizar CHANGELOG.md si hubo cambios user-facing

## Martes-Jueves: Desarrollo Enfocado
□ Para cada feature/fix:
  1. Escribir test primero (TDD)
  2. Implementar mínimo viable
  3. Validar con Zod si es IPC
  4. Actualizar docs si cambia API interna
□ Commits semánticos: `feat(laws): add PDF import with text extraction`
□ Push diario a rama feature, PR pequeño y enfocado

## Viernes: Integración y Release Prep
□ Ejecutar pipeline completo local: `npm run lint && npm run test:all && npm run build:linux`
□ Revisar logs de errores de la semana (si hay analytics)
□ Si hay release programado:
  - Generar changelog: `npm run changelog`
  - Taggear versión: `git tag v1.x.x`
  - Push con tags: `git push origin main --tags`
  - ✅ GitHub Actions se encarga del resto

## Domingo (Opcional): Aprendizaje y Experimentación
□ Leer 1 artículo técnico o ver 1 charla sobre Electron/Testing/IA
□ Experimentar con 1 nueva herramienta en rama `spike/`
□ Contribuir a issue `good first issue` de otro proyecto OSS
□ Reflexionar: ¿qué aprendí esta semana? ¿qué puedo mejorar?

🎯 Próximos Pasos Inmediatos (Esta Semana)
# 1. Validación IPC con Zod (Alto impacto, bajo esfuerzo)
npm install zod
# Crear: electron/src/ipc/schemas/laws.js
# Actualizar: electron/src/ipc/laws.js para usar validateIPCInput

# 2. Tests de integración IPC (Alto impacto, medio esfuerzo)
# Crear: test/integration/ipc-handlers.test.js
# Ejecutar: npm run test:integration

# 3. Health check endpoint (Medio impacto, bajo esfuerzo)
# Crear: electron/src/ipc/app.js con handler 'app:health'
# Probar: desde renderer con ipcRenderer.invoke('app:health')

# 4. Script de cobertura (Bajo impacto, bajo esfuerzo)
# Actualizar package.json con scripts test:coverage:*
# Ejecutar: npm run test:coverage:report y revisar HTML

# 5. Preparar release automático (Alto impacto, medio esfuerzo)
# Crear: .github/workflows/release.yml
# Configurar secrets: GITHUB_TOKEN (automático), APPLE_ID (si aplica)
# Probar con tag de prueba: git tag v1.3.0-test && git push origin v1.3.0-test

    💬 Reflexión final: Llegar a 10/10 no es sobre perfección, es sobre consistencia, automatización y comunidad. Ya tienes la base técnica excepcional. Ahora se trata de escalar tu práctica con los mismos principios que usaste para construir la app: iterar, validar, documentar, automatizar.

Cuando completes la Biblioteca de Leyes MVP, estaremos listos para el plan de publicación Open Source.

## 16. Simplificación: Portal de Sesiones (GitHub Pages)
🔹 **Objetivo:** Desacoplar consulta de gestión. Admin único (Secretario).
🔹 **Plan de Implementación:**
- [ ] **Admin Centralizado:** Bloquear funciones de escritura solo para el rol "Secretario".
- [ ] **Exportación Automática:** El `syncEngine` generará `sesiones.json` en el repo de GitHub.
- [ ] **Portal Web:** Legisladores acceden vía URL pública/privada de GitHub Pages.

