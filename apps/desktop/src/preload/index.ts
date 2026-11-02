import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type PlatformApi } from '@sb/shared';

const api: PlatformApi = {
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
  echo: (text) => ipcRenderer.invoke(IPC.echo, text),
  getVaultStatus: () => ipcRenderer.invoke(IPC.getVaultStatus),
};

contextBridge.exposeInMainWorld('api', api);