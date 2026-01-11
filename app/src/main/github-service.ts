// GitHub service - Fetches PR status and CI checks via gh CLI

import { exec } from 'child_process';
import { promisify } from 'util';
import type { PRStatus } from '../shared/types';

const execAsync = promisify(exec);

/**
 * Check if gh CLI is installed and authenticated
 */
export async function isGhAvailable(): Promise<boolean> {
  try {
    const { stdout: version } = await execAsync('gh --version');
    console.log('[github-service] gh version:', version.trim());

    // Check if authenticated
    const { stdout, stderr } = await execAsync('gh auth status 2>&1');
    const output = stdout + stderr;
    console.log('[github-service] gh auth status:', output.trim());

    const isLoggedIn = output.includes('Logged in') || output.includes('✓');
    console.log('[github-service] Is logged in:', isLoggedIn);
    return isLoggedIn;
  } catch (error) {
    console.error('[github-service] gh not available:', error);
    return false;
  }
}

/**
 * Get PR information for a specific branch
 * @param branchName - The git branch name
 * @param repoPath - Path to the git repository (worktree or main repo)
 * @returns PR status or null if no PR exists
 */
export async function getPRForBranch(
  branchName: string,
  repoPath: string
): Promise<PRStatus | null> {
  try {
    console.log(`[github-service] Fetching PR for branch: ${branchName} in ${repoPath}`);

    // Use gh pr list to find PRs for this branch
    // --json gives us structured data we can parse
    const { stdout } = await execAsync(
      `gh pr list --head "${branchName}" --json number,title,url,state,isDraft,statusCheckRollup --limit 1`,
      { cwd: repoPath }
    );

    console.log(`[github-service] gh pr list output:`, stdout);

    const prs = JSON.parse(stdout);

    if (!prs || prs.length === 0) {
      console.log(`[github-service] No PR found for branch: ${branchName}`);
      return null;
    }

    console.log(`[github-service] Found PR:`, prs[0]);

    const pr = prs[0];

    // Parse CI check status
    const checks = pr.statusCheckRollup || [];
    const hasChecks = checks.length > 0;

    let checkState: 'pending' | 'success' | 'failure' = 'success';
    if (hasChecks) {
      // If any check is pending, overall state is pending
      if (checks.some((c: any) => c.status === 'PENDING' || c.status === 'IN_PROGRESS')) {
        checkState = 'pending';
      }
      // If any check failed, overall state is failure
      else if (checks.some((c: any) => c.conclusion === 'FAILURE' || c.conclusion === 'TIMED_OUT')) {
        checkState = 'failure';
      }
    }

    return {
      number: pr.number,
      title: pr.title,
      url: pr.url,
      state: pr.state,
      isDraft: pr.isDraft,
      checks: hasChecks ? [{
        state: checkState,
        conclusion: checkState === 'success' ? 'All checks passed' :
                    checkState === 'failure' ? 'Some checks failed' :
                    'Checks running',
      }] : undefined,
    };
  } catch (error) {
    console.error(`Failed to get PR for branch ${branchName}:`, error);
    return null;
  }
}
