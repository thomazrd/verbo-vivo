import {
  BookMarked,
  GraduationCap,
  HeartHandshake,
  Home,
  MessageSquare,
  NotebookText,
  Settings,
  Shield,
  Users,
  BookUser,
  Share2,
  Newspaper,
  Smile,
  BookOpenCheck,
  LockKeyhole,
  HandHeart,
  Swords,
  MicVocal,
} from "lucide-react";
import type { TFunction } from 'i18next';

export const mainNavItems = (t: TFunction) => [
  { href: "/home", label: t('nav_home'), icon: Home },
  { href: "/studies", label: t('nav_studies'), icon: GraduationCap },
  { href: "/battle-plans", label: t('nav_training'), icon: Swords },
  { href: "/community", label: t('nav_community'), icon: Users },
  { href: "/armor", label: t('nav_my_armor'), icon: Shield },
];

export const secondaryNavItems = (t: TFunction) => [
    { href: "/bible", label: t('nav_bible_reader'), icon: BookMarked },
    { href: "/chat", label: t('nav_chat'), icon: MessageSquare },
    { href: "/journal", label: t('nav_journal'), icon: NotebookText },
    { href: "/prayer-sanctuary", label: t('nav_sanctuary'), icon: MicVocal },
    { href: "/prayer-circles", label: t('nav_prayer_circles'), icon: HeartHandshake },
    { href: "/plans", label: t('nav_study_plans'), icon: BookOpenCheck },
    { href: "/blog", label: t('nav_articles'), icon: Newspaper },
    { href: "/characters", label: t('nav_characters'), icon: BookUser },
    { href: "/ponte-da-esperanca", label: t('nav_hope_bridge'), icon: Share2 },
    { href: "/feeling-journey", label: t('nav_feeling_journey'), icon: Smile },
    { href: "/confession", label: t('nav_confession'), icon: LockKeyhole },
    { href: "/faith-confession", label: t('nav_faith_confession'), icon: HandHeart },
    { href: "/settings", label: t('nav_settings'), icon: Settings },
];
