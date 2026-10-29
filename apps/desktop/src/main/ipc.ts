import { app, ipcMain } from 'electron';
import { IPC, EchoInputSchema, type AppInfo } from '@sb/shared';

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.getAppInfo, (): AppInfo => ({
    name: app.getName(),
    version: app.getVersion(),
    platform: process.platform as AppInfo['platform'],
  }));

  ipcMain.handle(IPC.echo, (_event, input: unknown): string => {
    const text = EchoInputSchema.parse(input);
    return `El sistema recibió: ${text}`;
  });
}