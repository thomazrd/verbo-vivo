
"use client";

import { type ReactNode, useState } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Initialize notification hooks for the logged-in user
  useNotifications();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen w-full bg-muted/40">
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div
        className={cn(
          "flex flex-col h-screen",
          isCollapsed
            ? "md:ml-[68px]"
            : "md:ml-[220px] lg:ml-[280px]"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
