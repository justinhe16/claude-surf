import { Badge } from '@/components/ui/badge';

export function ColorLegend() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300">
        Status Legend
      </h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-red-500/20 text-red-200 border-red-500/30">
            dirty
          </Badge>
          <span className="text-xs text-muted-foreground">
            Uncommitted changes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-200 border-green-500/30">
            pr-out
          </Badge>
          <span className="text-xs text-muted-foreground">
            PR submitted
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
            merged
          </Badge>
          <span className="text-xs text-muted-foreground">
            Merged to main
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gray-500/20 text-gray-200 border-gray-500/30">
            clean
          </Badge>
          <span className="text-xs text-muted-foreground">
            No changes
          </span>
        </div>
      </div>
    </div>
  );
}
