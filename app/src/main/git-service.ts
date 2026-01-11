// Git service - Scans ~/Projects for worktrees and determines their status

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { WorktreeData, WorktreeStatus, OriginType } from '../shared/types';

const execAsync = promisify(exec);

/**
 * Scans ~/Projects directory for git worktrees
 * Looks for directories matching pattern: <repo>-<branch>
 */
export async function scanWorktrees(): Promise<WorktreeData[]> {
  const projectsDir = path.join(os.homedir(), 'Projects');

  try {
    // Check if Projects directory exists
    await fs.access(projectsDir);
  } catch (error) {
    console.log('~/Projects directory not found, returning empty list');
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

  // Extract branch name from directory name
  // Pattern: <repo>-<branch> => extract everything after first dash
  const dashIndex = dirName.indexOf('-');
  const branchName =
    dashIndex !== -1 ? dirName.substring(dashIndex + 1) : dirName;

  // Detect origin type (solo-surf vs robot-surf)
  const originType = await detectOriginType(fullPath);

  // Get worktree status
  const status = await getWorktreeStatus(fullPath, branchName);

  // Get last modified time
  const stats = await fs.stat(fullPath);

  return {
    id: dirName,
    path: fullPath,
    branchName,
    originType,
    status,
    prUrl: undefined, // Will be populated by github-service in Phase 9
    lastModified: stats.mtime,
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
 * Delete a worktree directory
 * WARNING: This is destructive and cannot be undone
 */
export async function deleteWorktree(id: string): Promise<void> {
  const projectsDir = path.join(os.homedir(), 'Projects');
  const worktreePath = path.join(projectsDir, id);

  // Safety check: ensure path is within ~/Projects
  if (!worktreePath.startsWith(projectsDir)) {
    throw new Error('Invalid worktree path - security violation');
  }

  // Remove the directory
  await fs.rm(worktreePath, { recursive: true, force: true });
  console.log(`Deleted worktree: ${worktreePath}`);
}
