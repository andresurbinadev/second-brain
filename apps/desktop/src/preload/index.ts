import { contextBridge, ipcRenderer } from 'electron';
import { IPC, type PlatformApi } from '@sb/shared';

const api: PlatformApi = {
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),
  getVaultStatus: () => ipcRenderer.invoke(IPC.getVaultStatus),
  getDashboard: () => ipcRenderer.invoke(IPC.getDashboard),
  search: (query) => ipcRenderer.invoke(IPC.search, query),
  getPage: (id) => ipcRenderer.invoke(IPC.getPage, id),
  createPage: (input) => ipcRenderer.invoke(IPC.createPage, input),
};

contextBridge.exposeInMainWorld('api', api);