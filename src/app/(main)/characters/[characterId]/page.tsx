"use client";

import { useParams } from 'next/navigation';
import { bibleCharacters } from '@/lib/bible-characters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookMarked, KeyRound, Menu } from 'lucide-react';

export default function CharacterProfilePage() {
  const params = useParams();
  const characterId = params.characterId as string;
  const character = bibleCharacters.find((c) => c.id === characterId);

  if (!character) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 text-center">
        <h1 className="text-2xl font-bold">Personagem não encontrado</h1>
        <p className="mt-2 text-muted-foreground">
          O personagem que você está procurando não foi encontrado.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-4xl font-bold tracking-tight">{character.name}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mb-2">
                <Menu className="h-5 w-5 text-primary" />
                Resumo
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {character.summary}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mb-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Versículos-Chave
              </h2>
              <ul className="space-y-2">
                {character.keyVerses.map((verse) => (
                  <li key={verse} className="font-mono text-muted-foreground bg-muted/50 px-3 py-1 rounded-md text-sm">
                    {verse}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:col-span-1">
            <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2 mb-2">
              <BookMarked className="h-5 w-5 text-primary" />
              Plano de Estudo
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {character.studyPlan.map((task) => (
                 <AccordionItem value={`item-${task.day}`} key={task.day}>
                  <AccordionTrigger className="text-left">
                    <span className="font-semibold">Dia {task.day}:</span> {task.verseReference}
                  </AccordionTrigger>
                  <AccordionContent>
                    {task.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
