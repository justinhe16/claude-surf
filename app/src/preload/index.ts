// Preload script - Security bridge between main and renderer
// Exposes safe IPC API via contextBridge

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/types';

const electronAPI: ElectronAPI = {
  worktrees: {
    list: (directory?: string) => ipcRenderer.invoke('worktrees:list', directory),
    delete: (id: string, branchName: string, deleteBranch: boolean) =>
      ipcRenderer.invoke('worktrees:delete', id, branchName, deleteBranch),
    refresh: (directory?: string) => ipcRenderer.invoke('worktrees:refresh', directory),
  },
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded - electronAPI exposed');
