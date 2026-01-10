// React hook for fetching worktrees via IPC

import { useEffect, useState } from 'react';
import type { WorktreeData } from '../../shared/types';

export function useWorktrees() {
  const [worktrees, setWorktrees] = useState<WorktreeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorktrees = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await window.electronAPI.worktrees.list();
      setWorktrees(data);
    } catch (err) {
      console.error('Failed to fetch worktrees:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch worktrees');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWorktree = async (id: string) => {
    try {
      await window.electronAPI.worktrees.delete(id);
      // Refresh list after deletion
      await fetchWorktrees();
    } catch (err) {
      console.error('Failed to delete worktree:', err);
      throw err;
    }
  };

  const refresh = async () => {
    await fetchWorktrees();
  };

  // Fetch worktrees on mount
  useEffect(() => {
    fetchWorktrees();
  }, []);

  return {
    worktrees,
    isLoading,
    error,
    deleteWorktree,
    refresh,
  };
}
