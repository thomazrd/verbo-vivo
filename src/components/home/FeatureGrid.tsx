
"use client";

import { FeatureCard } from "./FeatureCard";
import {
  HeartHandshake,
  MessageSquare,
  Users,
  BookMarked,
  BookOpen,
  BookUser,
  NotebookText,
  Share2,
  Smile,
  Shield,
  LockKeyhole,
  HandHeart,
  Newspaper,
  Presentation,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeatureGrid() {
  const { t } = useTranslation();

  const features = [
    {
      icon: MessageSquare,
      title: t('feature_chat_title'),
      description: t('feature_chat_desc'),
      linkTo: "/chat",
      imageUrl: "https://dynamic.tiggomark.com.br/images/chat.jpg",
      imageHint: "person phone cafe",
    },
    {
      icon: Presentation,
      title: t('nav_studies'),
      description: 'Explore pílulas de sabedoria e estudos aprofundados sobre diversos temas da vida cristã.',
      linkTo: "/studies",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "sermon presentation",
    },
    {
      icon: BookMarked,
      title: t('feature_bible_reader_title'),
      description: t('feature_bible_reader_desc'),
      linkTo: "/bible",
      imageUrl: "https://dynamic.tiggomark.com.br/images/biblia.jpg",
      imageHint: "open bible coffee",
    },
    {
      icon: Shield,
      title: 'Minha Armadura',
      description: 'Crie e gerencie suas armaduras espirituais com versículos para as batalhas diárias.',
      linkTo: "/armor",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "knight armor shield",
    },
     {
      icon: Smile,
      title: t('feature_feeling_journey_title'),
      description: t('feature_feeling_journey_desc'),
      linkTo: "/feeling-journey",
      imageUrl: "https://dynamic.tiggomark.com.br/images/jornada.jpg",
      imageHint: "calm sunrise path",
    },
    {
      icon: BookOpen,
      title: t('feature_study_plans_title'),
      description: t('feature_study_plans_desc'),
      linkTo: "/plans",
      imageUrl: "https://dynamic.tiggomark.com.br/images/planos.jpg",
      imageHint: "person walking trail",
    },
     {
      icon: LockKeyhole,
      title: 'Confessionário',
      description: 'Um espaço privado e seguro para confessar seus pecados e receber uma palavra de graça e perdão.',
      linkTo: "/confession",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "private quiet room"
    },
    {
      icon: HandHeart,
      title: 'Confissão de Fé',
      description: 'Declare e fortaleça as verdades fundamentais da sua fé em uma jornada interativa.',
      linkTo: "/faith-confession",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "uplifted hands worship"
    },
    {
      icon: HeartHandshake,
      title: "Círculos de Oração",
      description: "Junte-se a grupos de oração, compartilhe pedidos e interceda por outros em um ambiente de fé e comunidade.",
      linkTo: "/prayer-circles",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "community prayer group"
    },
    {
      icon: Users,
      title: t('feature_community_title'),
      description: t('feature_community_desc'),
      linkTo: "/community",
      imageUrl: "https://dynamic.tiggomark.com.br/images/comunidade.jpg",
      imageHint: "community picnic laughing",
    },
    {
      icon: NotebookText,
      title: t('feature_journal_title'),
      description: t('feature_journal_desc'),
      linkTo: "/journal",
      imageUrl: "https://dynamic.tiggomark.com.br/images/diario.jpg",
      imageHint: "writing leather journal",
    },
     {
      icon: Newspaper,
      title: "Artigos",
      description: "Explore artigos e reflexões aprofundadas sobre diversos temas da fé cristã, escritos pela liderança.",
      linkTo: "/blog",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "person reading article"
    },
    {
      icon: BookUser,
      title: t('feature_characters_title'),
      description: t('feature_characters_desc'),
      linkTo: "/characters",
      imageUrl: "https://dynamic.tiggomark.com.br/images/personagens.jpg", 
      imageHint: "ancient crown map",
    },
    {
      icon: Share2,
      title: t('feature_hope_bridge_title'),
      description: t('feature_hope_bridge_desc'),
      linkTo: "/ponte-da-esperanca",
      imageUrl: "https://dynamic.tiggomark.com.br/images/ponte-esperanca.jpg",
      imageHint: "empathy comforting friend",
    },
  ];


  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        {t('home_discover_title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map((feature) => (
          <FeatureCard
            key={feature.linkTo}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            linkTo={feature.linkTo}
            imageUrl={feature.imageUrl}
            imageHint={feature.imageHint}
          />
        ))}
      </div>
    </div>
  );
}
