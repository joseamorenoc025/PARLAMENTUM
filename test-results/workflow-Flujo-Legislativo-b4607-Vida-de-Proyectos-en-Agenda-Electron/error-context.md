# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.js >> Flujo Legislativo y UX Transversal >> Ciclo de Vida de Proyectos en Agenda
- Location: test\e2e\workflow.spec.js:46:3

# Error details

```
TimeoutError: page.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('nav button:has-text("Agenda Legislativa")')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "Segundo Cerebro" [level=1] [ref=e13]
    - paragraph [ref=e14]: Sistema de Gestión Legislativa
  - generic [ref=e15]:
    - generic [ref=e16]:
      - generic [ref=e17]: Usuario
      - generic [ref=e18]:
        - img [ref=e19]
        - textbox "admin" [ref=e22]
    - generic [ref=e23]:
      - generic [ref=e24]: Contraseña
      - generic [ref=e25]:
        - img [ref=e26]
        - textbox "••••••••" [ref=e29]
        - button [ref=e30] [cursor=pointer]:
          - img [ref=e31]
    - button "Acceder al Sistema" [ref=e34] [cursor=pointer]:
      - text: Acceder al Sistema
      - img [ref=e35]
  - button "Registrar nuevo Administrador" [ref=e38] [cursor=pointer]:
    - img [ref=e39]
    - text: Registrar nuevo Administrador
```

# Test source

```ts
  1   | import { test, expect, _electron as electron } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * Suite de Pruebas de Flujo Legislativo Completo
  5   |  * Incluye validación de Temas (Dark/Light) en cada módulo.
  6   |  */
  7   | test.describe('Flujo Legislativo y UX Transversal', () => {
  8   |   let electronApp;
  9   |   let window;
  10  | 
  11  |   test.beforeAll(async () => {
  12  |     // Lanzar la aplicación
  13  |     electronApp = await electron.launch({ args: ['.'] });
  14  |     window = await electronApp.firstWindow();
  15  |   });
  16  | 
  17  |   test.afterAll(async () => {
  18  |     await electronApp.close();
  19  |   });
  20  | 
  21  |   test('Configuración Inicial y Dashboard (Modo Oscuro/Claro)', async () => {
  22  |     // 1. Manejar Onboarding si aparece
  23  |     const onboarding = window.locator('h2:has-text("Bienvenido")');
  24  |     if (await onboarding.isVisible()) {
  25  |       await window.click('button:has-text("Configurar más tarde")');
  26  |     }
  27  | 
  28  |     // 2. Verificar Dashboard
  29  |     await expect(window.locator('header span')).toContainText('Dashboard');
  30  |     
  31  |     // 3. Test de Tema Transversal
  32  |     const body = window.locator('body');
  33  |     const themeBtn = window.locator('header button').last(); // El botón de sol/luna
  34  |     
  35  |     // Verificar estado inicial (Oscuro por defecto)
  36  |     await expect(body.locator('xpath=..')).toHaveClass(/dark/);
  37  |     
  38  |     // Cambiar a Claro
  39  |     await themeBtn.click();
  40  |     await expect(body.locator('xpath=..')).not.toHaveClass(/dark/);
  41  |     
  42  |     // Regresar a Oscuro para los siguientes tests
  43  |     await themeBtn.click();
  44  |   });
  45  | 
  46  |   test('Ciclo de Vida de Proyectos en Agenda', async () => {
  47  |     // 1. Navegar a Agenda
> 48  |     await window.click('nav button:has-text("Agenda Legislativa")');
      |                  ^ TimeoutError: page.click: Timeout 30000ms exceeded.
  49  |     await expect(window.locator('h1')).toContainText('Gestión de Proyectos');
  50  | 
  51  |     // 2. Crear Nuevo Proyecto
  52  |     await window.click('button:has-text("Nuevo Proyecto")');
  53  |     await window.fill('input[placeholder*="Ej: Reforma"]', 'Proyecto de Prueba E2E');
  54  |     await window.fill('textarea[placeholder*="Descripción"]', 'Descripción automatizada para pruebas de integridad.');
  55  |     await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/test-e2e');
  56  |     
  57  |     await window.click('button:has-text("Registrar")');
  58  |     
  59  |     // 3. Verificar creación en vista Kanban o Lista
  60  |     await expect(window.locator('text=Proyecto de Prueba E2E')).toBeVisible();
  61  | 
  62  |     // 4. Probar Edición (Sincronización de Drive)
  63  |     // Buscamos el botón de editar en la tarjeta
  64  |     await window.click('button[title="Editar Proyecto"]');
  65  |     await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/updated-link');
  66  |     await window.click('button:has-text("Actualizar")');
  67  |     
  68  |     await expect(window.locator('text=Actualizado correctamente')).toBeVisible();
  69  |   });
  70  | 
  71  |   test('Módulo de Acuerdos y Acceso QR', async () => {
  72  |     // 1. Navegar a Acuerdos
  73  |     await window.click('nav button:has-text("Acuerdos")');
  74  |     await expect(window.locator('h1')).toContainText('Acuerdos de Cámara');
  75  | 
  76  |     // 2. Crear Acuerdo
  77  |     await window.click('button:has-text("Nuevo Acuerdo")');
  78  |     await window.fill('input[placeholder="Ej: 001-2024"]', 'ACU-2026-001');
  79  |     await window.fill('textarea[placeholder*="objeto"]', 'Acuerdo de prueba para validación de flujo E2E.');
  80  |     await window.fill('input[placeholder*="drive.google.com"]', 'https://drive.google.com/acuerdo-test');
  81  |     
  82  |     await window.click('button:has-text("Registrar")');
  83  | 
  84  |     // 3. Verificar visibilidad y QR
  85  |     await expect(window.locator('text=ACU-2026-001')).toBeVisible();
  86  |     
  87  |     // Probar apertura de QR (abre nueva ventana en Electron)
  88  |     await window.click('button[title="QR Acceso"]');
  89  |     // Nota: Validar que no hay errores al abrir la ventana popup
  90  |   });
  91  | 
  92  |   test('Integridad Visual y Logout', async () => {
  93  |     // Volver a dashboard
  94  |     await window.click('nav button:has-text("Dashboard")');
  95  |     
  96  |     // Logout
  97  |     await window.click('button:has-text("Cerrar Sesión")');
  98  |     await expect(window.locator('h1')).toContainText('Segundo Cerebro');
  99  |   });
  100 | });
  101 | 
```