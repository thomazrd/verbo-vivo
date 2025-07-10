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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/plans", label: "Planos", icon: BookOpen },
  { href: "/bible", label: "Bíblia", icon: BookMarked },
  { href: "/journal", label: "Diário", icon: NotebookText },
  { href: "/prayer-sanctuary", label: "Santuário", icon: HeartHandshake },
  { href: "/community", label: "Comunidade", icon: Users },
  { href: "/characters", label: "Personagens", icon: BookUser },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-16 items-center border-b px-4 lg:px-6">
          <Link href="/chat" className="flex items-center gap-2 font-semibold">
            <BookHeart className="h-6 w-6 text-primary" />
            <span className="">Verbo Vivo</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => (
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
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}