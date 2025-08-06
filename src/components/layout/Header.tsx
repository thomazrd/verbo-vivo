
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookHeart,
  MessageSquare,
  BookOpen,
  NotebookText,
  User,
  Users,
  BookUser,
  HeartHandshake,
  Menu,
  BookMarked,
  Share2,
  Home,
  Smile,
  Newspaper,
  Shield,
  LockKeyhole,
  GraduationCap,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { NotificationBell } from "../notifications/NotificationBell";
import { WisdomPearl } from "./WisdomPearl";
import { useTranslation } from "react-i18next";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { t } = useTranslation();

  const navItems = [
    { href: "/home", label: t('nav_home'), icon: Home },
    { href: "/studies", label: "Estudar", icon: GraduationCap },
    { href: "/community", label: t('nav_community'), icon: Users },
    { href: "/journal", label: t('nav_journal'), icon: NotebookText },
    { href: "/armor", label: 'Minha Armadura', icon: Shield },
    { href: "/chat", label: t('nav_chat'), icon: MessageSquare },
  ];

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex-1 items-center justify-center hidden md:flex">
         <WisdomPearl />
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-4">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || 'Avatar do usuário'} />
                    <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                      {userProfile?.displayName?.[0]?.toUpperCase() || <User />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.displayName || t('my_account')}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav_settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('sign_out_button')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
