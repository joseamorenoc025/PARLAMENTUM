# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: workflow.spec.js >> Flujo Legislativo y UX Transversal >> Módulo de Acuerdos y Acceso QR
- Location: test\e2e\workflow.spec.js:71:3

# Error details

```
TimeoutError: page.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('nav button:has-text("Acuerdos")')

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
  21  |   test('Configuración Inicial, Login y Dashboard (Modo Oscuro/Claro)', async () => {
  22  |     // 1. Manejar Onboarding si aparece
  23  |     const isWelcomeVisible = await window.locator('h2:has-text("Bienvenido a Cerebro Legislativo")').isVisible({ timeout: 2000 }).catch(() => false);
  24  |     if (isWelcomeVisible) {
  25  |       await window.click('button:has-text("Configurar más tarde")');
  26  |     }
  27  | 
  28  |     // 2. Manejar AuthScreen si aparece
  29  |     const isAuthVisible = await window.locator('h1:has-text("Segundo Cerebro")').isVisible({ timeout: 2000 }).catch(() => false);
  30  |     const isSignupVisible = await window.locator('h1:has-text("Crear Administrador")').isVisible({ timeout: 1000 }).catch(() => false);
  31  |     
  32  |     if (isSignupVisible) {
  33  |       // Registrar usuario de prueba
  34  |       await window.fill('input[placeholder*="Ej: Dr."]', 'Admin Prueba');
  35  |       await window.fill('input[placeholder="admin"]', 'admin');
  36  |       await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
  37  |       await window.click('button:has-text("Registrar")');
  38  |       // Esperar a que pase a login
  39  |       await window.waitForSelector('text=Bienvenido,', { state: 'visible', timeout: 5000 }).catch(() => {});
  40  |     } else if (isAuthVisible) {
  41  |       // Iniciar sesión
  42  |       await window.fill('input[placeholder="admin"]', 'admin');
  43  |       await window.fill('input[placeholder="••••••••"]', 'Admin123!@#');
  44  |       await window.click('button:has-text("Acceder")');
  45  |     }
  46  | 
  47  |     // 3. Verificar Dashboard (ahora debería estar visible)
  48  |     await expect(window.locator('header span')).toContainText('Dashboard', { timeout: 10000 });
  49  |     
  50  |     // 4. Test de Tema Transversal
  51  |     const body = window.locator('body');
  52  |     const themeBtn = window.locator('header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)').last();
  53  |     
  54  |     // Verificar estado inicial (Oscuro por defecto)
  55  |     await expect(body.locator('xpath=..')).toHaveClass(/dark/);
  56  |     
  57  |     // Cambiar a Claro
  58  |     await themeBtn.click();
  59  |     await expect(body.locator('xpath=..')).not.toHaveClass(/dark/);
  60  |     
  61  |     // Regresar a Oscuro para los siguientes tests
  62  |     await themeBtn.click();
  63  |   });
  64  | 
  65  |   test('Ciclo de Vida de Proyectos en Agenda', async () => {
  66  |     // 1. Navegar a Agenda
  67  |     await window.click('nav button:has-text("Agenda Legislativa")');
  68  |     await expect(window.locator('h1')).toContainText('Gestión de Proyectos');
  69  | 
  70  |     // 2. Crear Nuevo Proyecto
  71  |     await window.click('button:has-text("Nuevo Proyecto")');
  72  |     await window.fill('input[placeholder*="Ej: Reforma"]', 'Proyecto de Prueba E2E');
> 73  |     await window.fill('textarea[placeholder*="Descripción"]', 'Descripción automatizada para pruebas de integridad.');
      |                  ^ TimeoutError: page.click: Timeout 30000ms exceeded.
  74  |     await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/test-e2e');
  75  |     
  76  |     await window.click('button:has-text("Registrar")');
  77  |     
  78  |     // 3. Verificar creación en vista Kanban o Lista
  79  |     await expect(window.locator('text=Proyecto de Prueba E2E')).toBeVisible();
  80  | 
  81  |     // 4. Probar Edición (Sincronización de Drive)
  82  |     // Buscamos el botón de editar en la tarjeta
  83  |     await window.click('button[title="Editar Proyecto"]');
  84  |     await window.fill('input[placeholder*="https://drive.google.com"]', 'https://drive.google.com/updated-link');
  85  |     await window.click('button:has-text("Actualizar")');
  86  |     
  87  |     await expect(window.locator('text=Actualizado correctamente')).toBeVisible();
  88  |   });
  89  | 
  90  |   test('Módulo de Acuerdos y Acceso QR', async () => {
  91  |     // 1. Navegar a Acuerdos
  92  |     await window.click('nav button:has-text("Acuerdos")');
  93  |     await expect(window.locator('h1')).toContainText('Acuerdos de Cámara');
  94  | 
  95  |     // 2. Crear Acuerdo
  96  |     await window.click('button:has-text("Nuevo Acuerdo")');
  97  |     await window.fill('input[placeholder="Ej: 001-2024"]', 'ACU-2026-001');
  98  |     await window.fill('textarea[placeholder*="objeto"]', 'Acuerdo de prueba para validación de flujo E2E.');
  99  |     await window.fill('input[placeholder*="drive.google.com"]', 'https://drive.google.com/acuerdo-test');
  100 |     
  101 |     await window.click('button:has-text("Registrar")');
  102 | 
  103 |     // 3. Verificar visibilidad y QR
  104 |     await expect(window.locator('text=ACU-2026-001')).toBeVisible();
  105 |     
  106 |     // Probar apertura de QR (abre nueva ventana en Electron)
  107 |     await window.click('button[title="QR Acceso"]');
  108 |     // Nota: Validar que no hay errores al abrir la ventana popup
  109 |   });
  110 | 
  111 |   test('Integridad Visual y Logout', async () => {
  112 |     // Volver a dashboard
  113 |     await window.click('nav button:has-text("Dashboard")');
  114 |     
  115 |     // Logout
  116 |     await window.click('button:has-text("Cerrar Sesión")');
  117 |     await expect(window.locator('h1')).toContainText('Segundo Cerebro');
  118 |   });
  119 | });
  120 | 
```