import { useEffect, useState } from 'react';
import { useWorktreeStore } from './store/worktree-store';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteModal } from '@/components/DeleteModal';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorktreeData } from '../shared/types';

function App() {
  // Zustand store
  const {
    worktrees,
    isLoading,
    error,
    filterText,
    scanDirectory,
    filteredWorktrees,
    autoRefreshEnabled,
    autoRefreshInterval,
    lastRefreshed,
    showRefreshIndicator,
    githubConnected,
    setFilterText,
    setScanDirectory,
    fetchWorktrees,
    deleteWorktree,
    refresh,
  } = useWorktreeStore();

  // Timer to track seconds since last refresh
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [worktreeToDelete, setWorktreeToDelete] = useState<WorktreeData | null>(null);

  // Fetch worktrees on mount
  useEffect(() => {
    fetchWorktrees();
  }, []);

  // Update timer every second
  useEffect(() => {
    if (!lastRefreshed) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastRefreshed.getTime()) / 1000);
      setSecondsAgo(diff);
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [lastRefreshed]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    console.log(`[App] Auto-refresh enabled, interval: ${autoRefreshInterval}ms`);

    const intervalId = setInterval(() => {
      console.log('[App] Auto-refreshing worktrees...');
      refresh();
    }, autoRefreshInterval);

    return () => {
      console.log('[App] Cleaning up auto-refresh interval');
      clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, autoRefreshInterval, refresh]);

  // Delete handlers
  const handleDeleteClick = (worktree: WorktreeData) => {
    setWorktreeToDelete(worktree);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (deleteBranch: boolean) => {
    if (!worktreeToDelete) return;
    await deleteWorktree(worktreeToDelete.id, worktreeToDelete.branchName, deleteBranch);
  };

  return (
    <Layout
      filterText={filterText}
      onFilterChange={setFilterText}
      scanDirectory={scanDirectory}
      onScanDirectoryChange={setScanDirectory}
      githubConnected={githubConnected}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Worktrees</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredWorktrees().length} of {worktrees.length} worktrees
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastRefreshed && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">
                  Refreshed ({secondsAgo} second{secondsAgo !== 1 ? 's' : ''} ago)
                </span>
              </div>
            )}
            <Button onClick={refresh} size="sm" variant="outline">
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-muted-foreground text-center">
                Loading worktrees from ~/Projects...
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-500/50">
            <CardContent className="py-8">
              <p className="text-sm text-red-500 text-center">
                Error: {error}
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && worktrees.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">
                  No worktrees found
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first worktree to get started
                </p>
                <div className="flex gap-2 justify-center">
                  <code className="px-3 py-1.5 bg-slate-800 rounded text-sm">
                    /solo-surf feature-name
                  </code>
                  <span className="text-muted-foreground">or</span>
                  <code className="px-3 py-1.5 bg-slate-800 rounded text-sm">
                    /robot-surf LIN-123
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && worktrees.length > 0 && filteredWorktrees().length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">
                  No matches found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try a different search term
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && filteredWorktrees().length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredWorktrees().map((wt) => {
                const borderColor =
                  wt.status === 'dirty'
                    ? 'border-red-500/60'
                    : wt.status === 'merged'
                    ? 'border-purple-500/60'
                    : wt.status === 'pr-out'
                    ? 'border-green-500/60'
                    : 'border-gray-500/60';

                return (
                  <motion.div
                    key={wt.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  >
                    <Card
                      className={`transition-all hover:shadow-md flex flex-col ${borderColor}`}
                    >
                <CardContent className="py-4 flex-1 flex flex-col">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg text-slate-900">
                      {wt.branchName}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3 truncate">
                    {wt.path}
                  </p>

                  {/* PR Status */}
                  {wt.prStatus && (
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <a
                          href={wt.prStatus.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          PR #{wt.prStatus.number}
                        </a>
                        <Badge
                          variant="outline"
                          className={
                            wt.prStatus.state === 'MERGED'
                              ? 'bg-purple-500/20 text-purple-700 border-purple-500/60'
                              : wt.prStatus.state === 'CLOSED'
                              ? 'bg-red-500/20 text-red-700 border-red-500/60'
                              : 'bg-green-500/20 text-green-700 border-green-500/60'
                          }
                        >
                          {wt.prStatus.state}
                        </Badge>
                        {wt.prStatus.isDraft && (
                          <Badge variant="outline" className="bg-gray-500/20 text-gray-700 border-gray-500/60">
                            Draft
                          </Badge>
                        )}
                      </div>
                      {wt.prStatus.checks && wt.prStatus.checks.length > 0 && (
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={
                              wt.prStatus.checks[0].state === 'success'
                                ? 'text-green-600'
                                : wt.prStatus.checks[0].state === 'failure'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }
                          >
                            {wt.prStatus.checks[0].state === 'success'
                              ? '✅ CI Passing'
                              : wt.prStatus.checks[0].state === 'failure'
                              ? '❌ CI Failing'
                              : '⏳ CI Running'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 items-center flex-wrap mb-3">
                    <Badge
                      variant="outline"
                      className="bg-blue-500/20 text-blue-700 border-blue-500/60"
                    >
                      {wt.originType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        wt.status === 'dirty'
                          ? 'bg-red-500/20 text-red-700 border-red-500/60'
                          : wt.status === 'merged'
                          ? 'bg-purple-500/20 text-purple-700 border-purple-500/60'
                          : wt.status === 'pr-out'
                          ? 'bg-green-500/20 text-green-700 border-green-500/60'
                          : 'bg-gray-500/20 text-gray-700 border-gray-500/60'
                      }
                    >
                      {wt.status}
                    </Badge>
                  </div>
                  <div className="flex justify-end mt-auto">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded"
                      onClick={() => handleDeleteClick(wt)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  )}
      </div>

      <DeleteModal
        worktree={worktreeToDelete}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
      />
    </Layout>
  );
}

export default App;
