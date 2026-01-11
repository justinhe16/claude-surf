import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  filterText: string;
  onFilterChange: (text: string) => void;
  scanDirectory: string;
  onScanDirectoryChange: (dir: string) => void;
  githubConnected: boolean | null;
}

export function Layout({ children, filterText, onFilterChange, scanDirectory, onScanDirectoryChange, githubConnected }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        filterText={filterText}
        onFilterChange={onFilterChange}
        scanDirectory={scanDirectory}
        onScanDirectoryChange={onScanDirectoryChange}
        githubConnected={githubConnected}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
