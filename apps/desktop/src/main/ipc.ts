import { app, ipcMain } from 'electron';
import type Database from 'better-sqlite3-multiple-ciphers';
import { IPC, EchoInputSchema, type AppInfo, type VaultStatus } from '@sb/shared';

export function registerIpcHandlers(db: Database.Database): void {
  ipcMain.handle(IPC.getAppInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform as AppInfo['platform'],
  }));

  ipcMain.handle(IPC.echo, (_event, input: unknown): string => {
    const text = EchoInputSchema.parse(input);
    return `El sistema recibió: ${text}`;
  });

  ipcMain.handle(IPC.getVaultStatus, (): VaultStatus => {
    const version = db.prepare('SELECT version FROM schema_version').get() as { version: number };
    const pages = db.prepare('SELECT count(*) AS n FROM pages').get() as { n: number };
    return { schemaVersion: version.version, pages: pages.n };
  });
}