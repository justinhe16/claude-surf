// Electron main process
// Phase 3: Secure IPC architecture with contextIsolation

import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { registerIPCHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Disable node integration in renderer
      nodeIntegration: false,
      // Preload script exposes safe IPC API
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  // Load from Vite dev server in development, or from built files in production
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register IPC handlers before creating window
  registerIPCHandlers();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
