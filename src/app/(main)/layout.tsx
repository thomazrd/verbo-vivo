
"use client";

import { type ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { FocusModeProvider, useFocusMode } from '@/contexts/focus-mode-context';

function AppLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { isFocusMode } = useFocusMode();
  
  // Initialize notification hooks for the logged-in user
  useNotifications();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const isImmersivePage = pathname.startsWith('/armor/battle/');
  
  if (isFocusMode || isImmersivePage) {
    return (
        <main className="flex-1 overflow-y-auto h-screen">
          {children}
        </main>
    )
  }

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


export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <FocusModeProvider>
        <AppLayout>{children}</AppLayout>
    </FocusModeProvider>
  )
}
