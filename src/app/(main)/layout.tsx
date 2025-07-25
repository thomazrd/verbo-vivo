
"use client";

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { FocusModeProvider, useFocusMode } from '@/contexts/focus-mode-context';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { isFocusMode } = useFocusMode();
  
  // Initialize notification hooks for the logged-in user
  useNotifications();

  useEffect(() => {
    if (!loading && !user) {
        router.push(`/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const immersivePages = ['/armor/battle/', '/faith-confession'];
  const isImmersivePage = immersivePages.some(path => pathname.startsWith(path));
  
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
