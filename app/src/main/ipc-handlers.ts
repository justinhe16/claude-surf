// IPC handlers - Handle requests from renderer process

import { ipcMain } from 'electron';
import { scanWorktrees, deleteWorktree } from './git-service';

/**
 * Register all IPC handlers
 * Called once during app initialization
 */
export function registerIPCHandlers(): void {
  // List all worktrees
  ipcMain.handle('worktrees:list', async () => {
    console.log('IPC: worktrees:list requested');
    try {
      const worktrees = await scanWorktrees();
      console.log(`IPC: Found ${worktrees.length} worktrees`);
      return worktrees;
    } catch (error) {
      console.error('IPC: Error listing worktrees:', error);
      throw error;
    }
  });

  // Delete a worktree
  ipcMain.handle('worktrees:delete', async (_event, id: string) => {
    console.log(`IPC: worktrees:delete requested for ${id}`);
    try {
      await deleteWorktree(id);
      console.log(`IPC: Successfully deleted ${id}`);
    } catch (error) {
      console.error(`IPC: Error deleting ${id}:`, error);
      throw error;
    }
  });

  // Refresh worktrees (same as list, but explicit for clarity)
  ipcMain.handle('worktrees:refresh', async () => {
    console.log('IPC: worktrees:refresh requested');
    try {
      const worktrees = await scanWorktrees();
      console.log(`IPC: Refreshed ${worktrees.length} worktrees`);
      return worktrees;
    } catch (error) {
      console.error('IPC: Error refreshing worktrees:', error);
      throw error;
    }
  });

  console.log('IPC handlers registered');
}
