import { app, ipcMain } from 'electron';
import type Database from 'better-sqlite3-multiple-ciphers';
import { buildDashboard, createPage } from '@sb/core';
import { IPC, NewPageInputSchema, PageIdSchema, SearchInputSchema, type AppInfo, type VaultStatus } from '@sb/shared';
import { getPage, insertPage, listPages } from './vault/pages';
import { listAllRelationships } from './vault/relationships';
import { searchPages } from './vault/search';

// El gestor de peticiones: qué responde main a cada canal.
// Regla: todo lo que llega de la interfaz es `unknown` y se valida con zod antes de usarlo.
export function registerIpcHandlers(db: Database.Database): void {
  ipcMain.handle(IPC.getAppInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform as AppInfo['platform'],
  }));

  ipcMain.handle(IPC.getVaultStatus, (): VaultStatus => {
    const version = db.prepare('SELECT version FROM schema_version').get() as { version: number };
    const pages = db.prepare('SELECT count(*) AS n FROM pages').get() as { n: number };
    return { schemaVersion: version.version, pages: pages.n };
  });

  ipcMain.handle(IPC.getDashboard, () => buildDashboard(listPages(db), listAllRelationships(db)));

  ipcMain.handle(IPC.search, (_event, input: unknown) => searchPages(db, SearchInputSchema.parse(input)));

  ipcMain.handle(IPC.getPage, (_event, input: unknown) => getPage(db, PageIdSchema.parse(input)) ?? null);

  // Lo que crea el usuario desde la interfaz nace con procedencia "user" y confirmado.
  ipcMain.handle(IPC.createPage, (_event, input: unknown) => {
    const page = createPage({ ...NewPageInputSchema.parse(input), provenance: 'user' });
    insertPage(db, page);
    return page;
  });
}