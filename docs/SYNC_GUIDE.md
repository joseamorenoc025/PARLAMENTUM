# Guía de Sincronización y Portal Ciudadano

Este documento explica cómo configurar y mantener el sistema de publicación automática de leyes.

## 🚀 Concepto: QR Único y Portal Centralizado

A diferencia de sistemas que generan un QR por cada documento, **Cerebro Legislativo** utiliza un **Portal Ciudadano Centralizado**. 

*   **El QR Único:** Debe apuntar a la URL de tu portal (ej: `https://joseamorenoc025.github.io/cerebro_legislativo/public/portal/`).
*   **El Portal:** Permite a los ciudadanos buscar, filtrar por año y descargar cualquier ley desde una única interfaz moderna.

## 🛠️ Configuración Inicial

### 1. Preparar GitHub
1.  Crea un repositorio en GitHub (si no lo tienes).
2.  Genera un **Personal Access Token (classic)** en [GitHub Settings](https://github.com/settings/tokens).
    *   Permisos necesarios: `repo` (Full control of private repositories).
3.  Habilita **GitHub Pages** en los ajustes del repositorio:
    *   Source: Deploy from a branch.
    *   Branch: `main` / Folder: `/(root)`.

### 2. Configurar la App
1.  Ve a la pestaña **Sincronización** en la aplicación.
2.  Ingresa tu Token de GitHub.
3.  Configura el Usuario y el nombre del Repositorio.
4.  Presiona **Sincronizar Metadata Ahora**. Esto creará el archivo `leyes.json` en tu repositorio.

## 🔄 Flujo de Trabajo Diario

1.  **Registrar Ley:** Al importar una ley en la **Biblioteca**, la app extrae el texto y la guarda localmente.
2.  **Sincronización Automática:** La app encola el cambio automáticamente. Si tienes internet, se subirá a GitHub en segundos.
3.  **Portal Actualizado:** El ciudadano escanea el QR, entra al portal y ve la nueva ley inmediatamente.

## 🛡️ Resiliencia Offline
Si trabajas sin conexión:
*   Los cambios se guardan en la **Cola de Pendientes**.
*   El indicador en la cabecera mostrará 🟡 **SINCRONIZANDO...**.
*   En cuanto recuperes la conexión, la app detectará el cambio y actualizará el portal sin intervención manual.

---
*Cerebro Legislativo - Transparencia Automatizada*
