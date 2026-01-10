// Shared types between main and renderer processes

export type WorktreeStatus = 'clean' | 'dirty' | 'merged' | 'pr-out';
export type OriginType = 'solo-surf' | 'robot-surf';

export interface WorktreeData {
  id: string; // Unique identifier (directory name)
  path: string; // Full path to worktree
  branchName: string; // Git branch name
  originType: OriginType; // How it was created
  status: WorktreeStatus; // Current status
  prUrl?: string; // GitHub PR URL if exists
  lastModified: Date; // Last modification time
}

export interface PRStatus {
  number: number;
  title: string;
  url: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  isDraft: boolean;
  checks?: {
    state: 'pending' | 'success' | 'failure';
    conclusion: string;
  }[];
}

// IPC API exposed to renderer via preload
export interface ElectronAPI {
  worktrees: {
    list: () => Promise<WorktreeData[]>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<WorktreeData[]>;
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
