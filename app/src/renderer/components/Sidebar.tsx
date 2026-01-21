import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ColorLegend } from './ColorLegend';
import { Github, ExternalLink } from 'lucide-react';
import claudeSurfLogo from '/claude_surf.png';

interface SidebarProps {
  filterText: string;
  onFilterChange: (text: string) => void;
  scanDirectory: string;
  onScanDirectoryChange: (dir: string) => void;
  githubConnected: boolean | null;
}

export function Sidebar({ filterText, onFilterChange, scanDirectory, onScanDirectoryChange, githubConnected }: SidebarProps) {
  return (
    <div className="w-1/4 min-w-[280px] bg-slate-900 p-6 flex flex-col gap-6 border-r border-slate-700">
      {/* Logo */}
      <div className="flex flex-col items-center gap-4">
        <img
          src={claudeSurfLogo}
          alt="Claude Surf"
          className="w-32 h-32 rounded-lg"
        />
        <h2 className="text-xl font-bold text-white text-center">
          Claude Surf
        </h2>
      </div>

      <Separator className="bg-slate-700" />

      {/* Scan Directory */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          Scan Directory
        </label>
        <Input
          type="text"
          placeholder="~/Projects"
          value={scanDirectory}
          onChange={(e) => onScanDirectoryChange(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <Separator className="bg-slate-700" />

      {/* Filter */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-300">
          Filter Projects
        </label>
        <Input
          type="text"
          placeholder="Search worktrees..."
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      <Separator className="bg-slate-700" />

      {/* GitHub Status */}
      <div className="flex items-center gap-2">
        <Github className="w-4 h-4 text-slate-300" />
        <div className={`w-2 h-2 rounded-full ${
          githubConnected === null
            ? 'bg-gray-500'
            : githubConnected
            ? 'bg-green-500'
            : 'bg-red-500'
        }`} />
        <span className="text-sm text-slate-300">
          {githubConnected === null ? 'Checking...' : githubConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <Separator className="bg-slate-700" />

      {/* Color Legend */}
      <ColorLegend />

      <Separator className="bg-slate-700" />

      {/* Guide */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">
          Quick Guide
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              /check-surf
            </kbd>{' '}
            Check prerequisites
          </p>
          <p>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              /prep-surf
            </kbd>{' '}
            Install prerequisites
          </p>
          <p>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              /solo-surf
            </kbd>{' '}
            Create manual worktree
          </p>
          <p>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              /robot-surf
            </kbd>{' '}
            Plan + implement ticket
          </p>
          <p>
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
              /robot-surf-prompt
            </kbd>{' '}
            Plan + implement from prompt
          </p>
        </div>
      </div>

      <Separator className="bg-slate-700" />

      {/* GitHub Repo Link */}
      <a
        href="https://github.com/justinhe16/claude-surf"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
      >
        <Github className="w-4 h-4" />
        <span>Claude Surf GitHub Repo</span>
        <ExternalLink className="w-3 h-3 ml-auto" />
      </a>

      {/* Spacer to push version to bottom */}
      <div className="flex-grow" />

      {/* Version */}
      <div className="text-xs text-slate-500 text-center">
        v1.0.5
      </div>
    </div>
  );
}
