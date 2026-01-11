import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  filterText: string;
  onFilterChange: (text: string) => void;
  scanDirectory: string;
  onScanDirectoryChange: (dir: string) => void;
}

export function Layout({ children, filterText, onFilterChange, scanDirectory, onScanDirectoryChange }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        filterText={filterText}
        onFilterChange={onFilterChange}
        scanDirectory={scanDirectory}
        onScanDirectoryChange={onScanDirectoryChange}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
