import { app, BrowserWindow, dialog, shell } from 'electron';
import path from 'node:path';
import type Database from 'better-sqlite3-multiple-ciphers';
import { registerIpcHandlers } from './ipc';
import { openVault } from './vault/db';
import { getOrCreateVaultKey } from './vault/key';

let vault: Database.Database | undefined;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Second Brain',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  try {
    const dir = app.getPath('userData');
    vault = openVault(path.join(dir, 'vault.db'), await getOrCreateVaultKey(dir));
  } catch (err) {
    dialog.showErrorBox('No se pudo abrir la bóveda', String(err));
    app.quit();
    return;
  }

  registerIpcHandlers(vault);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  vault?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});