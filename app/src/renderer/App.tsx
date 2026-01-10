import { useState, useMemo } from 'react';
import { useWorktrees } from './hooks/useWorktrees';
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

function App() {
  const { worktrees, isLoading, error, refresh } = useWorktrees();
  const [filterText, setFilterText] = useState('');

  // Filter worktrees based on search text
  const filteredWorktrees = useMemo(() => {
    if (!filterText.trim()) return worktrees;

    const search = filterText.toLowerCase();
    return worktrees.filter(
      (wt) =>
        wt.branchName.toLowerCase().includes(search) ||
        wt.id.toLowerCase().includes(search) ||
        wt.path.toLowerCase().includes(search)
    );
  }, [worktrees, filterText]);

  return (
    <Layout filterText={filterText} onFilterChange={setFilterText}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Worktrees</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredWorktrees.length} of {worktrees.length} worktrees
            </p>
          </div>
          <Button onClick={refresh} size="sm" variant="outline">
            Refresh
          </Button>
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

        {!isLoading && !error && worktrees.length > 0 && filteredWorktrees.length === 0 && (
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

        {!isLoading && !error && filteredWorktrees.length > 0 && (
          <div className="space-y-3">
            {filteredWorktrees.map((wt) => (
              <Card
                key={wt.id}
                className="transition-all hover:shadow-md"
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {wt.branchName}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {wt.path}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge
                        variant="outline"
                        className="bg-purple-500/10 text-purple-300 border-purple-500/30"
                      >
                        {wt.originType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          wt.status === 'dirty'
                            ? 'bg-red-500/10 text-red-300 border-red-500/30'
                            : wt.status === 'merged'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : wt.status === 'pr-out'
                            ? 'bg-green-500/10 text-green-300 border-green-500/30'
                            : 'bg-gray-500/10 text-gray-300 border-gray-500/30'
                        }
                      >
                        {wt.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default App;
