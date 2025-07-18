
"use client";

import type { Armor, ArmorWeapon } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

function BattleVerseCard({ weapon }: { weapon: ArmorWeapon }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
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
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary/80" />
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-primary">
                {weapon.verseReference}
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <blockquote className="text-lg sm:text-xl md:text-2xl font-serif leading-relaxed text-foreground border-t pt-4 sm:pt-6">
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

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 bg-gradient-to-br from-background via-gray-900 to-background text-foreground flex flex-col">
      <header className="flex-shrink-0 p-4 flex justify-between items-center z-10">
        <h1 className="text-base sm:text-lg font-semibold text-muted-foreground">{armor.name}</h1>
        <Button variant="ghost" size="icon" onClick={() => router.push('/armor')}>
          <X className="h-5 w-5" />
          <span className="sr-only">Sair do Modo Batalha</span>
        </Button>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center relative w-full">
          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full max-w-4xl"
          >
            <CarouselContent className="ml-0">
              {armor.weapons.map((weapon) => (
                <CarouselItem key={weapon.id} className="p-2 sm:p-4 md:p-6 lg:p-8">
                  <BattleVerseCard weapon={weapon} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-secondary/80 hover:bg-secondary text-primary h-10 w-10 sm:h-12 sm:w-12" />
            <CarouselNext className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-secondary/80 hover:bg-secondary text-primary h-10 w-10 sm:h-12 sm:w-12" />
          </Carousel>
      </div>
      
    </div>
  );
}
