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
  Swords, // Adicionado ícone de espadas para Treinamento
  MicVocal, // Adicionado ícone para o Santuário
} from "lucide-react";
import type { TFunction } from 'i18next';

export const mainNavItems = (t: TFunction) => [
  { href: "/home", label: t('nav_home'), icon: Home },
  { href: "/studies", label: t('nav_studies'), icon: GraduationCap },
  { href: "/battle-plans", label: 'Treinamento', icon: Swords }, // Item de Treinamento adicionado
  { href: "/community", label: t('nav_community'), icon: Users },
  { href: "/armor", label: 'Minha Armadura', icon: Shield },
  { href: "/bible", label: t('feature_bible_reader_title'), icon: BookMarked },
];

export const secondaryNavItems = (t: TFunction) => [
    { href: "/chat", label: t('nav_chat'), icon: MessageSquare },
    { href: "/journal", label: t('nav_journal'), icon: NotebookText },
    { href: "/prayer-sanctuary", label: 'Santuário de Oração', icon: MicVocal },
    { href: "/prayer-circles", label: t('prayer_circles_title'), icon: HeartHandshake },
    { href: "/plans", label: 'Meus Planos de Estudo', icon: BookOpenCheck },
    { href: "/blog", label: "Artigos", icon: Newspaper },
    { href: "/characters", label: t('feature_characters_title'), icon: BookUser },
    { href: "/ponte-da-esperanca", label: t('feature_hope_bridge_title'), icon: Share2 },
    { href: "/feeling-journey", label: t('feature_feeling_journey_title'), icon: Smile },
    { href: "/confession", label: 'Confessionário', icon: LockKeyhole },
    { href: "/faith-confession", label: 'Confissão de Fé', icon: HandHeart },
    { href: "/settings", label: t('nav_settings'), icon: Settings },
];
