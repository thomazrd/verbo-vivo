
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookHeart,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Painel", icon: LayoutDashboard },
    { href: "/admin/content", label: "Conteúdos", icon: FileText },
    { href: "/admin/suggestions", label: "Sugestões", icon: Lightbulb },
  ];
  
  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    // The layout's auth check will handle the redirect
  };


  return (
    <div
      className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:flex-col border-e bg-background transition-[width] duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-56"
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 shrink-0">
          <Link href="/admin" className="flex items-center gap-2 font-semibold">
            <BookHeart className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="">Admin</span>}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <TooltipProvider delayDuration={0}>
            <nav className="grid items-start p-2 text-sm font-medium gap-1">
              {navItems.map((item) =>
                isCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                          pathname.startsWith(item.href) && "bg-muted text-primary"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                      pathname.startsWith(item.href) && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </TooltipProvider>
        </div>
        <div className="mt-auto p-2 border-t">
           <TooltipProvider delayDuration={0}>
             <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="w-full justify-center" size={isCollapsed ? 'icon' : 'default'} onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                    {!isCollapsed && <span className="ms-2">Sair</span>}
                  </Button>
                </TooltipTrigger>
                {isCollapsed && <TooltipContent side="right">Sair</TooltipContent>}
              </Tooltip>
           </TooltipProvider>

           <Button variant="outline" size="icon" className="w-full h-9 mt-2" onClick={onToggle}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
