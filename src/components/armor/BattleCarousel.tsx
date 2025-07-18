
"use client";

import type { Armor, ArmorWeapon } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

function BattleVerseCard({ weapon }: { weapon: ArmorWeapon }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <motion.div
        key={weapon.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20 shadow-lg text-center">
          <CardHeader>
            <div className="flex justify-center items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary/80" />
                <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
                {weapon.verseReference}
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <blockquote className="text-xl md:text-2xl font-serif leading-relaxed text-foreground border-t pt-6">
              <p>“{weapon.verseText}”</p>
            </blockquote>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export function BattleCarousel({ armor }: { armor: Armor }) {
  const router = useRouter();
  const [api, setApi] = useState<CarouselApi>();

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 bg-gradient-to-br from-background via-gray-900 to-background text-foreground flex flex-col">
      <header className="flex-shrink-0 p-4 flex justify-between items-center z-10">
        <h1 className="text-lg font-semibold text-muted-foreground">{armor.name}</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/armor')}>
          <X className="h-5 w-5" />
          <span className="sr-only">Sair do Modo Batalha</span>
        </Button>
      </header>

      <div className="flex-1 flex flex-col justify-center">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent className="ml-0">
              {armor.weapons.map((weapon) => (
                <CarouselItem key={weapon.id}>
                  <BattleVerseCard weapon={weapon} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
      </div>


      <footer className="flex-shrink-0 z-10 p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => api?.scrollPrev()}
              disabled={!api?.canScrollPrev()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm"
              onClick={() => api?.scrollNext()}
              disabled={!api?.canScrollNext}
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
