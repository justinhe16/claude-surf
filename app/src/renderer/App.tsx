import { useWorktrees } from './hooks/useWorktrees';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function App() {
  const { worktrees, isLoading, error, refresh } = useWorktrees();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8">
      <h1 className="text-5xl font-bold text-white mb-4">
        Claude Surf
      </h1>
      <p className="text-xl text-purple-100 mb-8">
        {'React + TS + Vite => Code-First UI'}
      </p>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Phase 3: IPC Architecture</CardTitle>
              <CardDescription>
                {'Secure communication: Renderer <=> Main Process'}
              </CardDescription>
            </div>
            <Button onClick={refresh} size="sm" variant="outline">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              Loading worktrees from ~/Projects...
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500">
              Error: {error}
            </p>
          )}

          {!isLoading && !error && worktrees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">
                No worktrees found in ~/Projects
              </p>
              <p className="text-xs text-muted-foreground">
                {'Try running: /solo-surf <branch-name>'}
              </p>
            </div>
          )}

          {!isLoading && !error && worktrees.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Found {worktrees.length} worktree{worktrees.length !== 1 ? 's' : ''}:
              </p>
              {worktrees.map((wt) => (
                <div
                  key={wt.id}
                  className="p-3 border rounded-lg bg-background/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{wt.branchName}</p>
                      <p className="text-xs text-muted-foreground">{wt.path}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-200">
                        {wt.originType}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          wt.status === 'dirty'
                            ? 'bg-red-500/20 text-red-200'
                            : wt.status === 'merged'
                            ? 'bg-purple-500/20 text-purple-200'
                            : wt.status === 'pr-out'
                            ? 'bg-green-500/20 text-green-200'
                            : 'bg-gray-500/20 text-gray-200'
                        }`}
                      >
                        {wt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
