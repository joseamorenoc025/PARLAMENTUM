# 🔄 Guía de Restauración de Copias de Seguridad

Esta guía explica cómo restaurar una copia de seguridad en **Segundo Cerebro Legislativo**.

## 🛡️ Seguridad
Las copias de seguridad generadas por el sistema (`.enc`) están protegidas mediante:
- **AES-256-GCM**: Encriptación de grado militar.
- **PBKDF2**: Derivación de clave robusta a partir de su contraseña.
- **Validación de Integridad**: El sistema verifica que el archivo no haya sido manipulado mediante etiquetas de autenticación (AuthTag) y hashes SHA-256.

## 📋 Requisitos para Restaurar
1. Un archivo de backup válido con extensión `.enc`.
2. La contraseña exacta utilizada al momento de crear dicho backup.
3. Versión de la aplicación compatible (se recomienda la más reciente).

## 🚀 Pasos para Restaurar

### Durante la Instalación Inicial (Onboarding)
Si acaba de instalar la aplicación o ha reseteado los datos:
1. Al abrir la aplicación, verá la pantalla de bienvenida.
2. Haga clic en el botón **"🔄 Restaurar desde backup"** en lugar de comenzar una nueva configuración.
3. Seleccione su archivo `.enc` haciendo clic en el área de carga.
4. Ingrese la contraseña de encriptación.
5. Haga clic en **"Restaurar y Continuar"**.
6. Si la contraseña es correcta, el sistema reemplazará la base de datos vacía por sus datos anteriores y lo llevará directamente al Dashboard.

### Reemplazo de Datos Existentes
**Advertencia**: Restaurar un backup borrará todos los datos actuales.
1. El sistema creará automáticamente una copia de seguridad interna de sus datos actuales en la carpeta `backups` antes de realizar la restauración, por seguridad.

## ❌ Solución de Problemas

| Error | Causa Probable | Solución |
|-------|----------------|----------|
| **Contraseña Incorrecta** | La contraseña ingresada no coincide con la del backup. | Verifique mayúsculas/minúsculas o intente con otra contraseña conocida. |
| **Archivo Corrupto** | El archivo fue modificado externamente o se descargó mal. | Intente usar otra copia del archivo o el backup original. |
| **Error de Extensión** | El archivo no tiene la extensión `.enc`. | Asegúrese de seleccionar el archivo correcto generado por el sistema. |

## 📂 Ubicación de Backups Automáticos
El sistema guarda backups automáticos y copias de pre-restauración en:
- **Windows**: `%APPDATA%\segundo-cerebro-legislativo\backups`
- **Linux**: `~/.config/segundo-cerebro-legislativo/backups`
- **macOS**: `~/Library/Application Support/segundo-cerebro-legislativo/backups`

---
*Nota: El personal técnico no puede recuperar su contraseña si la pierde. Por favor, guárdela en un lugar seguro.*
