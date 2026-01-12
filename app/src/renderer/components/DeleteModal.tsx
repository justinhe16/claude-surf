import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorktreeData } from '../../shared/types';

interface DeleteModalProps {
  worktree: WorktreeData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deleteBranch: boolean) => Promise<void>;
}

export function DeleteModal({
  worktree,
  open,
  onOpenChange,
  onConfirm,
}: DeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBranch, setDeleteBranch] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(deleteBranch);
      onOpenChange(false);
      // Reset checkbox for next time
      setDeleteBranch(false);
    } catch (error) {
      console.error('Failed to delete worktree:', error);
      // Error handling - could show a toast here
    } finally {
      setIsDeleting(false);
    }
  };

  if (!worktree) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Worktree?</DialogTitle>
          <DialogDescription>
            This will permanently delete the worktree directory and all its contents.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-700 min-w-[80px]">Branch:</span>
              <span className="text-slate-600 break-all">{worktree.branchName}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-700 min-w-[80px]">Path:</span>
              <span className="text-slate-600 break-all">{worktree.path}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-slate-700 min-w-[80px]">Status:</span>
              <span className="text-slate-600">{worktree.status}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={deleteBranch}
              onChange={(e) => setDeleteBranch(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-slate-700">
                Also delete git branch
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Usually only delete the branch after changes have been merged, or if you want to start fresh.
              </p>
            </div>
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Worktree'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
