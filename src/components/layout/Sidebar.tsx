
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookHeart,
  MessageSquare,
  BookOpen,
  NotebookText,
  HeartHandshake,
  Users,
  BookUser,
  BookMarked,
  Share2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/plans", label: "Planos", icon: BookOpen },
  { href: "/bible", label: "Bíblia", icon: BookMarked },
  { href: "/journal", label: "Diário", icon: NotebookText },
  { href: "/prayer-sanctuary", label: "Santuário", icon: HeartHandshake },
  { href: "/community", label: "Comunidade", icon: Users },
  { href: "/characters", label: "Personagens", icon: BookUser },
  { href: "/ponte-da-esperanca", label: "Ponte da Esperança", icon: Share2 },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2 relative">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/chat" className="flex items-center gap-2 font-semibold">
            <BookHeart className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="">Verbo Vivo</span>}
          </Link>
        </div>
        <div className="flex-1">
          <TooltipProvider delayDuration={0}>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
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
        <div className="mt-auto p-4">
           <Button variant="outline" size="icon" className="w-full h-9" onClick={onToggle}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">Retrair/Expandir menu</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
