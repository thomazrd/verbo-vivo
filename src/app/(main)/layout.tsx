
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
  
  // Initialize notification hooks for the logged-in user.
  // This hook is safe to call here as it handles its own user state logic.
  useNotifications();

  // Show a global loader while the auth state is being determined.
  if (loading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  const publicPaths = ['/studies', '/ponte', '/blog'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If loading is complete and there's no user on a protected route,
  // we return a loader. The redirection logic is now primarily handled
  // by the root page.tsx, preventing race conditions here.
  if (!user && !isPublicPath) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If a non-authenticated user tries to access a public path,
  // we render the content without the main layout (sidebar, header).
  if (!user && isPublicPath) {
    return <main className="flex-1 overflow-y-auto h-screen">{children}</main>;
  }
  
  // This case should ideally not be hit if redirection from page.tsx is working,
  // but it's a safe fallback.
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
