
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { suggestWeaponsForBattle } from '@/ai/flows/armor-suggestion-flow';
import { v4 as uuidv4 } from 'uuid';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const armorPieces = [
    { name: "Capacete da Salvação", description: "Protege sua mente com a certeza da sua salvação em Cristo." },
    { name: "Couraça da Justiça", description: "Guarda seu coração com uma vida de retidão diante de Deus." },
    { name: "Cinturão da Verdade", description: "Firma seus passos na verdade inabalável da Palavra de Deus." },
    { name: "Sapatos do Evangelho da Paz", description: "Te dá firmeza e prontidão para levar a paz de Cristo." },
    { name: "Escudo da Fé", description: "Defende você das setas inflamadas do inimigo." },
    { name: "Espada do Espírito", description: "Sua arma de ataque, viva e eficaz, para vencer a batalha." },
];

const battleKits = [
    { theme: "Vencer a Ansiedade", battle: "ansiedade" },
    { theme: "Combater o Medo", battle: "medo" },
    { theme: "Lidar com a Tristeza", battle: "tristeza" },
    { theme: "Controlar a Raiva", battle: "raiva" },
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [api, setApi] = useState<CarouselApi>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const handleNext = () => api?.scrollNext();

  const handleCreatePredefinedArmor = async (theme: string, battle: string) => {
    if (!user) return;
    setIsLoading(true);
    setLoadingMessage(`Forjando sua "Armadura para ${theme}"...`);

    try {
        const result = await suggestWeaponsForBattle({
            battle: battle,
            model: userProfile?.preferredModel,
            language: userProfile?.preferredLanguage,
        });
        
        const newArmor = {
            userId: user.uid,
            name: `Armadura para ${theme}`,
            description: `Um conjunto de armas para ${battle}.`,
            weapons: result.weapons.map(w => ({...w, id: uuidv4()})),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, `users/${user.uid}/armors`), newArmor);
        await setDoc(doc(db, `users/${user.uid}`), { armorOnboardingCompleted: true }, { merge: true });
        
        toast({
            title: "Armadura Forjada!",
            description: "Sua primeira armadura está pronta no seu arsenal.",
        });

        router.push('/armor');

    } catch (error) {
        console.error("Error creating predefined armor:", error);
        toast({ variant: 'destructive', title: "Erro", description: "Não foi possível forjar sua armadura. Tente novamente."});
        setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
        <div className="w-full max-w-2xl mx-auto text-center p-4 flex flex-col items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-4">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          <CarouselItem>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">O Chamado</h1>
            <Card className="p-8 text-center bg-muted/30 border-dashed">
                <p className="text-2xl font-serif italic">"Vistam toda a armadura de Deus, para poderem ficar firmes contra as ciladas do Diabo."</p>
                <p className="text-lg font-semibold mt-4 text-primary">Efésios 6:11</p>
            </Card>
            <Button size="lg" className="mt-8" onClick={handleNext}>Eu aceito o chamado</Button>
          </CarouselItem>

          <CarouselItem>
             <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Conheça seu Arsenal</h1>
             <div className="space-y-4">
                {armorPieces.map(piece => (
                    <Card key={piece.name} className="text-left p-4 hover:shadow-md transition-shadow">
                        <p className="font-bold text-primary">{piece.name}</p>
                        <p className="text-sm text-muted-foreground">{piece.description}</p>
                    </Card>
                ))}
             </div>
             <Button size="lg" className="mt-8" onClick={handleNext}>Estou pronto para forjar</Button>
          </CarouselItem>

          <CarouselItem>
             <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Sua Primeira Batalha</h1>
             <p className="text-muted-foreground mb-8">
                Todo soldado inicia seu treinamento enfrentando um desafio. Com a ajuda de Deus, qual batalha você quer se preparar para vencer hoje?
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {battleKits.map(kit => (
                    <Button key={kit.theme} size="lg" variant="outline" className="h-16 text-base" onClick={() => handleCreatePredefinedArmor(kit.theme, kit.battle)}>
                        {kit.theme}
                    </Button>
                ))}
             </div>
              <Button variant="link" className="mt-8" onClick={() => router.push('/armor/forge')}>
                  Quero forjar a minha do zero
              </Button>
          </CarouselItem>

        </CarouselContent>
      </Carousel>
    </div>
  );
}
