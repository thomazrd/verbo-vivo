
"use client";

import { type ReactNode, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
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

  // This effect handles redirecting unauthenticated users after loading is complete.
  useEffect(() => {
    if (loading) return; // Wait until authentication check is complete

    const publicPaths = ['/studies', '/ponte', '/blog'];
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    if (!user && !isPublicPath) {
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // If user is not logged in but on a public page, don't show the main layout, just the page content.
  const publicPaths = ['/studies', '/ponte', '/blog'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  if (!user && isPublicPath) {
    return <main className="flex-1 overflow-y-auto h-screen">{children}</main>;
  }
  
  // If we are here and there's no user, it means they are on a non-public page and will be redirected by the useEffect.
  // We can return a loader to avoid a flash of content before redirection.
  if (!user) {
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
