
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
} from "lucide-react";

const features = [
    {
      icon: HeartHandshake,
      title: "Santuário de Oração",
      description: "Grave suas orações com a voz e receba reflexões personalizadas.",
      linkTo: "/prayer-sanctuary",
      imageUrl: "/features/santurario.jpg",
      imageHint: "serene prayer light",
    },
    {
      icon: MessageSquare,
      title: "Converse com o Assistente",
      description: "Tire dúvidas e explore temas bíblicos com um assistente de IA.",
      linkTo: "/chat",
      imageUrl: "/features/chat.jpg",
      imageHint: "person phone cafe",
    },
    {
      icon: Users,
      title: "Comunidade da Igreja",
      description: "Conecte-se, compartilhe e cresça junto com sua congregação local.",
      linkTo: "/community",
      imageUrl: "/features/comunidade.jpg",
      imageHint: "community picnic laughing",
    },
    {
      icon: BookMarked,
      title: "Leitor da Bíblia",
      description: "Navegue pelas Escrituras e obtenha resumos de capítulos gerados por IA.",
      linkTo: "/bible",
      imageUrl: "/features/biblia.jpg",
      imageHint: "open bible coffee",
    },
    {
      icon: BookOpen,
      title: "Planos de Estudo",
      description: "Transforme conversas em planos de 7 dias e acompanhe seu progresso.",
      linkTo: "/plans",
      imageUrl: "/features/planos.jpg",
      imageHint: "person walking trail",
    },
    {
      icon: BookUser,
      title: "Heróis da Fé",
      description: "Explore a vida e as lições de personagens bíblicos importantes.",
      linkTo: "/characters",
      imageUrl: "https://placehold.co/600x400/967bb6/FFFFFF.png", // Mantido como placeholder
      imageHint: "ancient crown map",
    },
    {
      icon: NotebookText,
      title: "Diário da Fé",
      description: "Um espaço seguro para registrar suas orações, gratidões e reflexões.",
      linkTo: "/journal",
      imageUrl: "/features/diario.jpg",
      imageHint: "writing leather journal",
    },
    {
      icon: Share2,
      title: "Ponte da Esperança",
      description: "Gere e compartilhe páginas de conforto para quem precisa de apoio.",
      linkTo: "/ponte-da-esperanca",
      imageUrl: "/features/ponte-esperanca.jpg",
      imageHint: "empathy comforting friend",
    },
];

export function FeatureGrid() {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        Descubra o Poder do Verbo Vivo
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
