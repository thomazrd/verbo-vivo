
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
  Presentation,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeatureGrid() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Presentation,
      title: t('feature_studies_title'),
      description: t('feature_studies_desc'),
      linkTo: "/studies",
      imageUrl: "https://placehold.co/600x400.png",
      imageHint: "focused person studying",
    },
    {
      icon: HeartHandshake,
      title: t('feature_prayer_sanctuary_title'),
      description: t('feature_prayer_sanctuary_desc'),
      linkTo: "/prayer-sanctuary",
      imageUrl: "https://dynamic.tiggomark.com.br/images/santuario.jpg",
      imageHint: "serene prayer light",
    },
    {
      icon: MessageSquare,
      title: t('feature_chat_title'),
      description: t('feature_chat_desc'),
      linkTo: "/chat",
      imageUrl: "https://dynamic.tiggomark.com.br/images/chat.jpg",
      imageHint: "person phone cafe",
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
      icon: Smile,
      title: t('feature_feeling_journey_title'),
      description: t('feature_feeling_journey_desc'),
      linkTo: "/feeling-journey",
      imageUrl: "https://dynamic.tiggomark.com.br/images/jornada.jpg",
      imageHint: "calm sunrise path",
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
      icon: BookOpen,
      title: t('feature_study_plans_title'),
      description: t('feature_study_plans_desc'),
      linkTo: "/plans",
      imageUrl: "https://dynamic.tiggomark.com.br/images/planos.jpg",
      imageHint: "person walking trail",
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
      icon: NotebookText,
      title: t('feature_journal_title'),
      description: t('feature_journal_desc'),
      linkTo: "/journal",
      imageUrl: "https://dynamic.tiggomark.com.br/images/diario.jpg",
      imageHint: "writing leather journal",
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
