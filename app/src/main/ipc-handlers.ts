// IPC handlers - Handle requests from renderer process

import { ipcMain } from 'electron';
import { scanWorktrees, deleteWorktree } from './git-service';
import { isGhAvailable } from './github-service';

/**
 * Register all IPC handlers
 * Called once during app initialization
 */
export function registerIPCHandlers(): void {
  // List all worktrees
  ipcMain.handle('worktrees:list', async (_event, directory?: string) => {
    console.log(`IPC: worktrees:list requested for ${directory || '~/Projects'}`);
    try {
      const worktrees = await scanWorktrees(directory);
      console.log(`IPC: Found ${worktrees.length} worktrees`);
      return worktrees;
    } catch (error) {
      console.error('IPC: Error listing worktrees:', error);
      throw error;
    }
  });

  // Delete a worktree
  ipcMain.handle(
    'worktrees:delete',
    async (_event, id: string, branchName: string, deleteBranch: boolean) => {
      console.log(`IPC: worktrees:delete requested for ${id}, branch: ${branchName}, deleteBranch: ${deleteBranch}`);
      try {
        await deleteWorktree(id, branchName, deleteBranch);
        console.log(`IPC: Successfully deleted ${id}`);
      } catch (error) {
        console.error(`IPC: Error deleting ${id}:`, error);
        throw error;
      }
    }
  );

  // Refresh worktrees (same as list, but explicit for clarity)
  ipcMain.handle('worktrees:refresh', async (_event, directory?: string) => {
    console.log(`IPC: worktrees:refresh requested for ${directory || '~/Projects'}`);
    try {
      const worktrees = await scanWorktrees(directory);
      console.log(`IPC: Refreshed ${worktrees.length} worktrees`);
      return worktrees;
    } catch (error) {
      console.error('IPC: Error refreshing worktrees:', error);
      throw error;
    }
  });

  // Check if GitHub CLI is available and authenticated
  ipcMain.handle('github:checkAvailability', async () => {
    console.log('IPC: github:checkAvailability requested');
    try {
      const available = await isGhAvailable();
      console.log(`IPC: GitHub CLI available: ${available}`);
      return available;
    } catch (error) {
      console.error('IPC: Error checking GitHub availability:', error);
      return false;
    }
  });

  console.log('IPC handlers registered');
}
