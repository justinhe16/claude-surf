// Git service - Scans ~/Projects for worktrees and determines their status

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { WorktreeData, WorktreeStatus, OriginType, PRStatus, LiveStatus } from '../shared/types';
import { isGhAvailable, getPRForBranch } from './github-service';

const execAsync = promisify(exec);

/**
 * Scans directory for git worktrees
 * Looks for directories matching pattern: <repo>-<branch>
 * @param directory - Optional directory path (defaults to ~/Projects)
 */
export async function scanWorktrees(directory?: string): Promise<WorktreeData[]> {
  const projectsDir = directory
    ? directory.replace('~', os.homedir())
    : path.join(os.homedir(), 'Projects');

  console.log(`[git-service] Scanning directory: ${projectsDir} (raw input: ${directory || 'undefined'})`);

  try {
    // Check if Projects directory exists
    await fs.access(projectsDir);
  } catch (error) {
    console.log(`${projectsDir} directory not found, returning empty list`);
    return [];
  }

  const entries = await fs.readdir(projectsDir, { withFileTypes: true });

  // Filter directories that match worktree pattern (contains a dash)
  const worktreeDirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.includes('-'))
    .map((entry) => ({
      name: entry.name,
      fullPath: path.join(projectsDir, entry.name),
    }));

  // Process each potential worktree
  const worktrees = await Promise.all(
    worktreeDirs.map(async (dir) => {
      try {
        return await processWorktree(dir.name, dir.fullPath);
      } catch (error) {
        console.error(`Error processing ${dir.name}:`, error);
        return null;
      }
    })
  );

  // Filter out failed processing attempts
  return worktrees.filter((w): w is WorktreeData => w !== null);
}

/**
 * Process a single worktree directory
 */
async function processWorktree(
  dirName: string,
  fullPath: string
): Promise<WorktreeData | null> {
  // Check if .git exists and is a FILE (worktree), not a directory (regular clone)
  const gitPath = path.join(fullPath, '.git');
  try {
    const gitStats = await fs.stat(gitPath);

    // Worktrees have .git as a file, regular clones have .git as a directory
    if (!gitStats.isFile()) {
      console.log(`${dirName} is a regular git clone (not a worktree), skipping`);
      return null;
    }
  } catch {
    console.log(`${dirName} has no .git file, skipping`);
    return null;
  }

  // Get the actual branch name from git
  let branchName = dirName; // fallback
  try {
    const { stdout } = await execAsync('git branch --show-current', {
      cwd: fullPath,
    });
    branchName = stdout.trim();
    console.log(`[git-service] Branch name for ${dirName}: ${branchName}`);
  } catch (error) {
    console.warn(`Could not get branch name for ${dirName}, using directory name`);
  }

  // Detect origin type (solo-surf vs robot-surf)
  const originType = await detectOriginType(fullPath);

  // Get worktree status
  const status = await getWorktreeStatus(fullPath, branchName);

  // Detect live Claude Code status
  const liveStatusData = await detectLiveStatus(fullPath);

  // Get PR information if gh CLI is available
  let prStatus: PRStatus | null = null;
  try {
    console.log(`[git-service] Checking gh availability for ${branchName}...`);
    const ghAvailable = await isGhAvailable();
    console.log(`[git-service] gh available:`, ghAvailable);

    if (ghAvailable) {
      // Find the main repo path (worktrees store this in .git file)
      let repoPath = fullPath;
      try {
        const gitFile = await fs.readFile(path.join(fullPath, '.git'), 'utf-8');
        const match = gitFile.match(/gitdir: (.+)\/\.git\/worktrees\//);
        if (match) {
          repoPath = match[1];
          console.log(`[git-service] Found main repo at: ${repoPath}`);
        }
      } catch (error) {
        console.log(`[git-service] Using worktree path as repo path`);
      }

      console.log(`[git-service] Fetching PR for ${branchName} from ${repoPath}...`);
      prStatus = await getPRForBranch(branchName, repoPath);
      console.log(`[git-service] PR status for ${branchName}:`, prStatus);
    }
  } catch (error) {
    console.error(`[git-service] Could not fetch PR for ${branchName}:`, error);
  }

  // Get last modified time
  const stats = await fs.stat(fullPath);

  return {
    id: dirName,
    path: fullPath,
    branchName,
    originType,
    status,
    prStatus,
    lastModified: stats.mtime,
    liveStatus: liveStatusData.status,
    lastActive: liveStatusData.lastActive,
  };
}

/**
 * Detect if worktree was created by solo-surf or robot-surf
 * Checks for .claude-surf-meta.json file
 */
async function detectOriginType(worktreePath: string): Promise<OriginType> {
  const metaPath = path.join(worktreePath, '.claude-surf-meta.json');

  try {
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const meta = JSON.parse(metaContent);
    return meta.origin === 'robot-surf' ? 'robot-surf' : 'solo-surf';
  } catch {
    // No metadata file, assume solo-surf
    return 'solo-surf';
  }
}

/**
 * Detect live Claude Code status in worktree
 * Checks for .claude-surf-status.json file
 */
async function detectLiveStatus(worktreePath: string): Promise<{
  status: LiveStatus;
  lastActive?: Date;
}> {
  const statusPath = path.join(worktreePath, '.claude-surf-status.json');

  try {
    const statusContent = await fs.readFile(statusPath, 'utf-8');
    const statusData = JSON.parse(statusContent);

    // Check if status file is recent (within last 5 minutes = active)
    const lastActive = new Date(statusData.lastActive || statusData.timestamp);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const isActive = lastActive > fiveMinutesAgo && statusData.status === 'active';

    return {
      status: isActive ? 'active' : 'idle',
      lastActive,
    };
  } catch {
    // No status file
    return {
      status: 'unknown',
    };
  }
}

/**
 * Determine worktree status based on git state
 * Priority: dirty > merged > pr-out > clean
 */
async function getWorktreeStatus(
  worktreePath: string,
  branchName: string
): Promise<WorktreeStatus> {
  // 1. Check for dirty working tree (uncommitted changes)
  try {
    const { stdout: porcelain } = await execAsync('git status --porcelain', {
      cwd: worktreePath,
    });

    if (porcelain.trim().length > 0) {
      return 'dirty';
    }
  } catch (error) {
    console.error('Error checking git status:', error);
  }

  // 2. Check if branch is merged to main/master
  try {
    const { stdout: merged } = await execAsync(
      'git branch -r --merged origin/main || git branch -r --merged origin/master',
      { cwd: worktreePath }
    );

    if (merged.includes(`origin/${branchName}`)) {
      return 'merged';
    }
  } catch (error) {
    // Ignore errors - branch might not exist on remote yet
  }

  // 3. Check for PR (will be implemented in Phase 9 with gh CLI)
  // For now, we'll assume no PR exists
  // TODO: Integrate github-service.getPRForBranch()

  // 4. Default: clean
  return 'clean';
}

/**
 * Delete a worktree using git worktree remove
 * This properly cleans up git references and the main repo's worktree registry
 * Optionally also deletes the git branch
 * WARNING: This is destructive and cannot be undone
 */
export async function deleteWorktree(
  id: string,
  branchName: string,
  deleteBranch: boolean,
  directory?: string
): Promise<void> {
  const projectsDir = directory
    ? directory.replace('~', os.homedir())
    : path.join(os.homedir(), 'Projects');
  const worktreePath = path.join(projectsDir, id);

  // Safety check: ensure path is within scan directory
  if (!worktreePath.startsWith(projectsDir)) {
    throw new Error('Invalid worktree path - security violation');
  }

  // Step 1: Find the main repo by reading the .git file in the worktree
  let mainRepoPath = projectsDir;
  try {
    const gitFile = await fs.readFile(path.join(worktreePath, '.git'), 'utf-8');
    // .git file format: "gitdir: /path/to/main/repo/.git/worktrees/name"
    const match = gitFile.match(/gitdir: (.+)\/\.git\/worktrees\//);
    if (match) {
      mainRepoPath = match[1];
      console.log(`Found main repo at: ${mainRepoPath}`);
    }
  } catch (error) {
    console.log('Could not read .git file, using parent directory as main repo');
  }

  // Step 2: Delete the worktree first
  try {
    // Use git worktree remove --force to handle both clean and dirty worktrees
    // This properly cleans up .git/worktrees/ in the main repo
    await execAsync(`git worktree remove --force "${worktreePath}"`, {
      cwd: mainRepoPath,
    });
    console.log(`Deleted worktree using git: ${worktreePath}`);
  } catch (error) {
    // Fallback: If git command fails (e.g., not a worktree), just delete the directory
    console.warn(`git worktree remove failed, falling back to fs.rm: ${error}`);
    await fs.rm(worktreePath, { recursive: true, force: true });
    console.log(`Deleted directory: ${worktreePath}`);
  }

  // Step 3: Prune stale worktree administrative files
  try {
    await execAsync('git worktree prune', {
      cwd: mainRepoPath,
    });
    console.log('Pruned stale worktree references');
  } catch (error) {
    console.warn('Failed to prune worktrees:', error);
  }

  // Step 4: Delete the git branch if requested (now that worktree is gone)
  if (deleteBranch) {
    try {
      // Run from main repo, now that the worktree is deleted and pruned
      await execAsync(`git branch -D "${branchName}"`, {
        cwd: mainRepoPath,
      });
      console.log(`Deleted branch: ${branchName}`);
    } catch (error) {
      console.error(`Failed to delete branch ${branchName}:`, error);
      // Don't throw - worktree is already deleted
    }
  }
}
