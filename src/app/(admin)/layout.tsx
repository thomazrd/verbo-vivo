
"use client";

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Wait for the authentication state to be fully resolved.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // After loading, if there's no profile or the user is not an admin, redirect.
  // This logic runs after `useAuth` is fully resolved, preventing race conditions.
  if (!userProfile || userProfile.role !== 'ADMIN') {
    router.push('/home'); // Redirect non-admins to the main home page.
    return ( // Return a loader while redirecting to prevent flashing content.
        <div className="flex h-screen w-screen items-center justify-center bg-muted">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-muted/40">
        <AdminSidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(prev => !prev)}
        />
        <main className={`transition-[margin-left] duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
            {children}
        </main>
    </div>
  );
}
