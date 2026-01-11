// Shared types between main and renderer processes

export type WorktreeStatus = 'clean' | 'dirty' | 'merged' | 'pr-out';
export type OriginType = 'solo-surf' | 'robot-surf';
export type LiveStatus = 'active' | 'idle' | 'unknown';

export interface WorktreeData {
  id: string; // Unique identifier (directory name)
  path: string; // Full path to worktree
  branchName: string; // Git branch name
  originType: OriginType; // How it was created
  status: WorktreeStatus; // Current status
  prStatus?: PRStatus | null; // GitHub PR status if exists
  lastModified: Date; // Last modification time
  liveStatus?: LiveStatus; // Whether Claude Code is active
  lastActive?: Date; // Last time Claude was active
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
    list: (directory?: string) => Promise<WorktreeData[]>;
    delete: (id: string, branchName: string, deleteBranch: boolean) => Promise<void>;
    refresh: (directory?: string) => Promise<WorktreeData[]>;
  };
  github: {
    checkAvailability: () => Promise<boolean>;
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
