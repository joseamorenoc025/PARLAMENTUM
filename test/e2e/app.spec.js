import { test, expect, _electron as electron } from '@playwright/test';

test('launch app', async () => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  
  // Verificar que la ventana cargó (el título se configura en App.jsx o index.html)
  // Nota: Ajustar el selector según lo que se espere ver al inicio
  const title = await window.title();
  console.log('App title:', title);
  
  await electronApp.close();
});
