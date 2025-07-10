
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Wand } from "lucide-react";
import type { Verse } from "@/lib/types";
import { Button } from "../ui/button";
import { GuidedMeditationModal } from "../meditation/GuidedMeditationModal";

const predefinedVerses: Verse[] = [
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", theme: "Força" },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; de nada terei falta.", theme: "Confiança" },
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "Amor" },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", theme: "Esperança" },
  { reference: "Isaías 41:10", text: "Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.", theme: "Coragem" },
];

export function VerseOfTheDay() {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isMeditationOpen, setIsMeditationOpen] = useState(false);

  useEffect(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const verseIndex = dayOfYear % predefinedVerses.length;
    setVerse(predefinedVerses[verseIndex]);
  }, []);

  if (!verse) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-transparent border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-center">Versículo do Dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto text-center bg-muted/50 border-dashed">
        <CardHeader>
          <div className="flex flex-col items-center">
              <BookOpen className="h-6 w-6 text-primary/90 mb-2" />
              <CardTitle className="text-base font-semibold text-muted-foreground">Versículo do Dia</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <blockquote className="text-lg font-sans text-foreground">
            “{verse.text}”
          </blockquote>
          <CardDescription className="font-mono text-sm !mt-4 text-primary">{verse.reference}</CardDescription>
        </CardContent>
        <CardFooter className="justify-center pb-4">
            <Button variant="ghost" size="sm" onClick={() => setIsMeditationOpen(true)}>
                <Wand className="mr-2 h-4 w-4" />
                Meditar sobre este versículo
            </Button>
        </CardFooter>
      </Card>
      <GuidedMeditationModal 
        isOpen={isMeditationOpen}
        onClose={() => setIsMeditationOpen(false)}
        verse={verse}
      />
    </>
  );
}
