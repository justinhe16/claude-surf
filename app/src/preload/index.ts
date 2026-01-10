// Preload script - Security bridge between main and renderer
// Exposes safe IPC API via contextBridge

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/types';

const electronAPI: ElectronAPI = {
  worktrees: {
    list: () => ipcRenderer.invoke('worktrees:list'),
    delete: (id: string) => ipcRenderer.invoke('worktrees:delete', id),
    refresh: () => ipcRenderer.invoke('worktrees:refresh'),
  },
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded - electronAPI exposed');
