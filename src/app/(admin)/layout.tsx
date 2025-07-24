
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

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    // Adiciona o parâmetro de redirecionamento para voltar para a rota admin após o login
    router.push('/login?redirect=/admin');
    return null;
  }

  if (userProfile.role !== 'ADMIN') {
    router.push('/home');
    return null;
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
