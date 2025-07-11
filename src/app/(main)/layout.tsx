
"use client";

import { type ReactNode, useState } from 'react';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from '@/lib/utils';

export default function MainLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
