"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const onboardingSteps = [
  {
    title: "Bem-vindo(a) ao Verbo Vivo!",
    description: "Sua nova jornada de discipulado digital começa agora. Estamos felizes por ter você conosco.",
    imageSrc: "https://dynamic.tiggomark.com.br/images/welcome.jpg",
    imageHint: "welcome celebration",
  },
  {
    title: "Converse com a IA",
    description: "Faça perguntas, explore tópicos e receba respostas e conselhos baseados inteiramente nas Escrituras.",
    imageSrc: "https://dynamic.tiggomark.com.br/images/chat-onboarding.jpg",
    imageHint: "chat application",
  },
  {
    title: "Crie Planos de Estudo",
    description: "Transforme qualquer conversa em um plano de estudo de 7 dias para aprofundar seu conhecimento e fortalecer sua fé.",
    imageSrc: "https://dynamic.tiggomark.com.br/images/plan-onboarding.jpg",
    imageHint: "study plan",
  },
];

export function OnboardingClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFinishOnboarding = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { onboardingCompleted: true }, { merge: true });
      router.push("/chat");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.push("/chat"); // Failsafe
    }
  };

  return (
    <div className="w-full max-w-2xl text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Seja bem-vindo(a)!
      </h1>
      <p className="mt-2 text-muted-foreground">
        Vamos conhecer os recursos principais em alguns passos.
      </p>
      <Carousel className="w-full mt-8">
        <CarouselContent>
          {onboardingSteps.map((step, index) => (
            <CarouselItem key={index}>
              <Card className="overflow-hidden bg-card">
                <Image
                  src={step.imageSrc}
                  alt={step.title}
                  width={600}
                  height={350}
                  unoptimized={true}
                  className="w-full object-cover aspect-video bg-muted"
                  data-ai-hint={step.imageHint}
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
      <Button
        onClick={handleFinishOnboarding}
        disabled={isLoading}
        size="lg"
        className="mt-8"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Ir para o Chat
      </Button>
    </div>
  );
}
