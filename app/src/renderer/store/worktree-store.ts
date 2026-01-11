// Zustand store for worktree state management

import { create } from 'zustand';
import type { WorktreeData } from '../../shared/types';

interface WorktreeStore {
  // State
  worktrees: WorktreeData[];
  worktreeOrder: string[]; // IDs in custom order
  isLoading: boolean;
  error: string | null;
  filterText: string;
  scanDirectory: string;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in milliseconds
  lastRefreshed: Date | null;
  showRefreshIndicator: boolean;
  githubConnected: boolean | null; // null = unknown, true = connected, false = disconnected

  // Computed
  filteredWorktrees: () => WorktreeData[];
  orderedWorktrees: () => WorktreeData[];

  // Actions
  setFilterText: (text: string) => void;
  setScanDirectory: (dir: string) => void;
  fetchWorktrees: () => Promise<void>;
  deleteWorktree: (id: string, branchName: string, deleteBranch: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  setAutoRefresh: (enabled: boolean) => void;
  setAutoRefreshInterval: (interval: number) => void;
  reorderWorktrees: (newOrder: string[]) => void;
}

export const useWorktreeStore = create<WorktreeStore>((set, get) => ({
  // Initial state
  worktrees: [],
  worktreeOrder: [], // Will be populated when worktrees load
  isLoading: true,
  error: null,
  filterText: '',
  scanDirectory: '~/Projects',
  autoRefreshEnabled: true, // Enabled by default
  autoRefreshInterval: 30000, // 30 seconds default
  lastRefreshed: null,
  showRefreshIndicator: false,
  githubConnected: null, // Unknown initially

  // Computed ordered worktrees
  orderedWorktrees: () => {
    const { worktrees, worktreeOrder } = get();

    // If no custom order, return as-is
    if (worktreeOrder.length === 0) return worktrees;

    // Sort by custom order, then append any new worktrees not in order
    const ordered = worktreeOrder
      .map(id => worktrees.find(wt => wt.id === id))
      .filter((wt): wt is WorktreeData => wt !== undefined);

    const newWorktrees = worktrees.filter(wt => !worktreeOrder.includes(wt.id));
    return [...ordered, ...newWorktrees];
  },

  // Computed filtered worktrees (applies filter to ordered list)
  filteredWorktrees: () => {
    const { orderedWorktrees, filterText } = get();
    const ordered = orderedWorktrees();

    if (!filterText.trim()) return ordered;

    const search = filterText.toLowerCase();
    return ordered.filter(
      (wt) =>
        wt.branchName.toLowerCase().includes(search) ||
        wt.id.toLowerCase().includes(search) ||
        wt.path.toLowerCase().includes(search)
    );
  },

  // Actions
  setFilterText: (text) => set({ filterText: text }),

  setScanDirectory: (dir) => {
    set({ scanDirectory: dir });
    // Auto-fetch when directory changes
    get().fetchWorktrees();
  },

  fetchWorktrees: async () => {
    set({ isLoading: true, error: null });

    console.log(`[worktree-store] Fetching worktrees from: ${get().scanDirectory}`);

    try {
      // Check GitHub availability in parallel with fetching worktrees
      const [data, ghAvailable] = await Promise.all([
        window.electronAPI.worktrees.list(get().scanDirectory),
        window.electronAPI.github.checkAvailability(),
      ]);

      console.log(`[worktree-store] Received ${data.length} worktrees`);
      console.log(`[worktree-store] GitHub available: ${ghAvailable}`);

      // Initialize order if empty, preserve existing order for known worktrees
      const currentOrder = get().worktreeOrder;
      const newIds = data.map(wt => wt.id);
      const updatedOrder = currentOrder.length === 0
        ? newIds // First load - use fetch order
        : [...currentOrder.filter(id => newIds.includes(id)), ...newIds.filter(id => !currentOrder.includes(id))]; // Preserve order, add new ones

      set({
        worktrees: data,
        worktreeOrder: updatedOrder,
        isLoading: false,
        lastRefreshed: new Date(),
        showRefreshIndicator: true,
        githubConnected: ghAvailable,
      });
    } catch (err) {
      console.error('Failed to fetch worktrees:', err);
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch worktrees',
        isLoading: false,
      });
    }
  },

  deleteWorktree: async (id: string, branchName: string, deleteBranch: boolean) => {
    try {
      await window.electronAPI.worktrees.delete(id, branchName, deleteBranch);
      // Refresh list after deletion
      await get().fetchWorktrees();
    } catch (err) {
      console.error('Failed to delete worktree:', err);
      throw err;
    }
  },

  refresh: async () => {
    await get().fetchWorktrees();
  },

  setAutoRefresh: (enabled) => set({ autoRefreshEnabled: enabled }),

  setAutoRefreshInterval: (interval) => set({ autoRefreshInterval: interval }),

  reorderWorktrees: (newOrder) => set({ worktreeOrder: newOrder }),
}));
