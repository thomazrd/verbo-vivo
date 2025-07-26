
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Wand } from "lucide-react";
import type { Verse } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GuidedMeditationModal } from "@/components/meditation/GuidedMeditationModal";

const predefinedVerses: Verse[] = [
  { reference: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece.", theme: "Força" },
  { reference: "Salmos 23:1", text: "O Senhor é o meu pastor; de nada terei falta.", theme: "Confiança" },
  { reference: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", theme: "Amor" },
  { reference: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus, daqueles que são chamados segundo o seu propósito.", theme: "Esperança" },
  { reference: "Isaías 41:10", text: "Não tema, pois estou com você; não tenha medo, pois sou o seu Deus. Eu o fortalecerei e o ajudarei; eu o segurarei com a minha mão direita vitoriosa.", theme: "Coragem" },
];

export function VerseOfTheDayCard() {
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isMeditationOpen, setIsMeditationOpen] = useState(false);

  useEffect(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const verseIndex = dayOfYear % predefinedVerses.length;
    setVerse(predefinedVerses[verseIndex]);
  }, []);

  if (!verse) {
    return (
      <Card className="w-full">
        <CardHeader>
            <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2 mt-2" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-9 w-48" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary/90 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Versículo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <blockquote className="text-xl md:text-2xl font-serif text-foreground/90 italic">
            “{verse.text}”
          </blockquote>
          <CardDescription className="font-sans text-base !mt-4 text-primary font-semibold">{verse.reference}</CardDescription>
        </CardContent>
        <CardFooter>
            <Button variant="ghost" size="sm" onClick={() => setIsMeditationOpen(true)} className="text-primary hover:text-primary hover:bg-primary/10">
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
