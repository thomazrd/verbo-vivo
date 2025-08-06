
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center">
      <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden relative mb-8">
        <Image
            src="https://dynamic.tiggomark.com.br/images/welcome.jpg"
            alt="Confetes e serpentinas coloridas celebrando as boas-vindas."
            fill
            className="object-cover"
            data-ai-hint="welcome celebration"
        />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        Bem-vindo(a) ao Verbo Vivo!
      </h1>
      <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
        Sua nova jornada de discipulado digital começa agora. Estamos felizes por ter você conosco.
      </p>
      <Button size="lg" className="mt-8" onClick={onNext}>
        Começar
      </Button>
    </div>
  );
}
