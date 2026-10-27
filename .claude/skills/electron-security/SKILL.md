---
name: electron-security
description: Reglas de seguridad de Electron. Úsala siempre que toques main, preload, IPC, ventanas, protocolos, enlaces externos o la carga de ficheros.
---
# Seguridad Electron

- BrowserWindow: contextIsolation: true, sandbox: true, nodeIntegration: false, webSecurity: true. Nunca los cambies.
- Preload: exponer con contextBridge solo funciones concretas (`api.tasks.create(input)`), nunca ipcRenderer entero ni `require`.
- IPC: ipcMain.handle con canales en una lista fija; valida cada entrada con zod en main; comprueba el remitente (event.senderFrame.url).
- CSP estricta en index.html: default-src 'self'; sin 'unsafe-eval'.
- Bloquea la navegación (will-navigate) y window.open; abre los enlaces externos con shell.openExternal solo para https.
- Ficheros del usuario: rutas resueltas y comprobadas dentro de la carpeta de la app; nunca ejecutes nada importado.
- Sin secretos en el renderer. Las claves de API, si existen, viven en main y cifradas con safeStorage.
