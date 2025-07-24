
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
  ChevronRight,
  Home,
  Smile,
  Newspaper,
  Shield,
  LockKeyhole,
  HandHeart,
  Presentation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "../ui/button";
import { useTranslation } from "react-i18next";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  
  const navItems = [
    { href: "/home", label: t('nav_home'), icon: Home },
    { href: "/studies", label: t('nav_studies'), icon: Presentation },
    { href: "/chat", label: t('nav_chat'), icon: MessageSquare },
    { href: "/armor", label: 'Minha Armadura', icon: Shield },
    { href: "/feeling-journey", label: t('nav_journey'), icon: Smile },
    { href: "/confession", label: 'Confessionário', icon: LockKeyhole },
    { href: "/faith-confession", label: 'Confissão de Fé', icon: HandHeart },
    { href: "/plans", label: t('nav_plans'), icon: BookOpen },
    { href: "/bible", label: t('nav_bible'), icon: BookMarked },
    { href: "/journal", label: t('nav_journal'), icon: NotebookText },
    { href: "/prayer-circles", label: "Círculos de Oração", icon: HeartHandshake },
    { href: "/prayer-sanctuary", label: "Santuário", icon: HeartHandshake },
    { href: "/community", label: t('nav_community'), icon: Users },
    { href: "/blog", label: "Artigos", icon: Newspaper },
    { href: "/characters", label: t('nav_characters'), icon: BookUser },
    { href: "/ponte-da-esperanca", label: t('nav_hope_bridge'), icon: Share2 },
  ];

  return (
    <div
      className={cn(
        "hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:flex-col border-r bg-background transition-[width] duration-300 ease-in-out",
        isCollapsed ? "md:w-[68px]" : "md:w-[220px] lg:w-[280px]"
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 lg:px-6 shrink-0">
          <Link href="/home" className="flex items-center gap-2 font-semibold">
            <BookHeart className="h-6 w-6 text-primary" />
            {!isCollapsed && <span className="">Verbo Vivo</span>}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <TooltipProvider delayDuration={0}>
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1 py-4">
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
        <div className="mt-auto p-4 space-y-2 border-t">
           {appVersion && (
            <div className={cn("text-center text-xs text-muted-foreground font-mono", isCollapsed && "hidden")}>
                {t('version_label')}: {appVersion}
            </div>
           )}
           <Button variant="outline" size="icon" className="w-full h-9" onClick={onToggle}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">{t('toggle_sidebar_button')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
