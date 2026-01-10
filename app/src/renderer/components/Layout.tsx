import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  filterText: string;
  onFilterChange: (text: string) => void;
}

export function Layout({ children, filterText, onFilterChange }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar filterText={filterText} onFilterChange={onFilterChange} />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
