
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
  SignOut,
  Gear,
} from "@phosphor-icons/react";
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
    { href: "/battle-plans", label: 'Treinamento', icon: GraduationCap },
    { href: "/chat", label: t('nav_chat'), icon: MessageSquare },
    { href: "/armor", label: 'Minha Armadura', icon: Shield },
    { href: "/feeling-journey", label: t('nav_journey'), icon: Smile },
    { href: "/confession", label: 'Confessionário', icon: LockKeyhole },
    { href: "/faith-confession", label: 'Confissão de Fé', icon: HeartHandshake },
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

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('toggle_nav_menu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/home"
              className="flex items-center gap-2 text-lg font-semibold mb-4"
            >
              <BookHeart className="h-6 w-6 text-primary" />
              <span className="">Verbo Vivo</span>
            </Link>
            {navItems.map((item) => (
              <SheetClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname.startsWith(item.href) && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

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
                    <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || ''} />
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
                  <Gear className="me-2 h-4 w-4" />
                  <span>{t('nav_settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <SignOut className="me-2 h-4 w-4" />
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
