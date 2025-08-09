
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
  Users,
  NotebookText,
  Menu,
  Home,
  Shield,
  GraduationCap,
  Settings,
  LogOut,
  Sparkles,
  HeartHandshake,
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
import { ScrollArea } from "../ui/scroll-area";
import { secondaryNavItems, mainNavItems } from "./navigation-items";
import { useState } from "react";
import { FeelingModal } from "../feeling-journey/FeelingModal";

function UserIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    )
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { t } = useTranslation();
  const [isFeelingModalOpen, setIsFeelingModalOpen] = useState(false);


  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu de navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-0">
            <div className="flex h-16 items-center border-b px-4 shrink-0">
              <Link href="/home" className="flex items-center gap-2 font-semibold">
                <BookHeart className="h-6 w-6 text-primary" />
                <span className="">Verbo Vivo</span>
              </Link>
            </div>
            <ScrollArea className="flex-1">
              <nav className="grid items-start p-4 text-base font-medium gap-1">
                {mainNavItems(t).map((item) => (
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
              <div className="px-4"><div className="border-t my-2"></div></div>
              <nav className="grid items-start p-4 text-base font-medium gap-1">
                {secondaryNavItems(t).map((item) => (
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

            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="flex-1 items-center justify-center hidden md:flex">
          <WisdomPearl />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setIsFeelingModalOpen(true)}
            className="h-9"
          >
              <HeartHandshake className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Como estou me sentindo?</span>
          </Button>
          {user && (
            <div className="flex items-center gap-2">
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <div 
                        className="h-9 w-9 rounded-full p-0.5" 
                        style={{
                            backgroundImage: 'conic-gradient(from 180deg at 50% 50%, #10b981, #f59e0b, hsl(var(--accent)), hsl(var(--primary)), #10b981)',
                        }}
                    >
                        <Avatar className="h-full w-full">
                            <AvatarImage src={userProfile?.photoURL || ''} alt={userProfile?.displayName || 'Avatar do usuário'} />
                            <AvatarFallback className="bg-background hover:bg-background text-primary font-semibold">
                                {userProfile?.displayName?.[0]?.toUpperCase() || <UserIcon />}
                            </AvatarFallback>
                        </Avatar>
                    </div>
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
      <FeelingModal isOpen={isFeelingModalOpen} onClose={() => setIsFeelingModalOpen(false)} />
    </>
  );
}
