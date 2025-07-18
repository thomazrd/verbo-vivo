
"use client";

import type { Armor } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from '@/components/ui/button';
import { X, Share2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function BattleVerseCard({ verseText, verseReference }: { verseText: string, verseReference: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center p-8">
      <motion.p 
        key={verseReference}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif italic leading-tight"
      >
        “{verseText}”
      </motion.p>
      <motion.p 
        key={`${verseReference}-ref`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 text-xl font-semibold text-primary/80"
      >
        {verseReference}
      </motion.p>
    </div>
  );
}


export function BattleCarousel({ armor }: { armor: Armor }) {
  const router = useRouter();

  return (
    <div className="relative h-screen w-screen bg-background text-foreground flex flex-col">
        <header className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
            <h1 className="text-lg font-semibold text-muted-foreground">{armor.name}</h1>
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" disabled>
                    <Share2 className="h-5 w-5" />
                    <span className="sr-only">Compartilhar Arma</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => router.push('/armor')}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Sair do Modo Batalha</span>
                </Button>
            </div>
        </header>

        <Carousel className="flex-1 w-full h-full">
            <CarouselContent className="h-full">
                {armor.weapons.map((weapon) => (
                    <CarouselItem key={weapon.id} className="h-full">
                        <BattleVerseCard verseText={weapon.verseText} verseReference={weapon.verseReference} />
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
        </Carousel>
    </div>
  );
}
