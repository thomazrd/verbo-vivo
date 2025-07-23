
"use client";

import React, { useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeart, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { faithAffirmations, introVerse } from '@/lib/faith-affirmations';

function AffirmationCard({ title, text, verseReference, verseText }: {
  title: string;
  text: string;
  verseReference: string;
  verseText: string;
}) {
  return (
    <div className="flex h-full w-full items-center justify-center p-1">
      <motion.div
        key={title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-background text-center min-h-[60vh] sm:min-h-[50vh] flex flex-col justify-center border-primary/20 shadow-lg">
          <div className="bg-muted/50 p-4 border-b">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Fundamento Bíblico</p>
              <div className="text-sm text-foreground/80">
                <p className="italic">"{verseText}"</p>
                <p className="font-bold text-primary/80 mt-1">{verseReference}</p>
              </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <CardHeader>
              <div className="flex justify-center items-center gap-2">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
              <blockquote className="text-lg sm:text-xl md:text-2xl font-serif leading-relaxed text-primary border-none p-0 m-0">
                <p>“{text}”</p>
              </blockquote>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function FaithConfessionPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="h-full w-full overflow-hidden bg-background text-foreground flex flex-col items-center justify-center">
      <Carousel setApi={setApi} className="w-full h-full flex flex-col">
        <CarouselContent className="ml-0 flex-1">
          <CarouselItem key="intro" className="p-4 sm:p-6 md:p-8 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl"
            >
              <HandHeart className="h-16 sm:h-20 w-16 sm:w-20 text-primary mx-auto mb-6" />
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Confissão de Fé</h1>
              <blockquote className="mt-8 p-4 sm:p-6 border-l-4 border-primary bg-muted/50 rounded-r-lg">
                <p className="font-serif italic text-xl sm:text-2xl text-foreground">"{introVerse.text}"</p>
                <footer className="text-right text-base sm:text-lg font-semibold text-primary/80 mt-4 not-italic">— {introVerse.reference}</footer>
              </blockquote>
              <Button onClick={() => api?.scrollNext()} size="lg" className="mt-12">
                Começar a Declarar
              </Button>
            </motion.div>
          </CarouselItem>
          {faithAffirmations.map((affirmation) => (
            <CarouselItem key={affirmation.title} className="p-4 sm:p-6 md:p-8 flex items-center">
              <AffirmationCard {...affirmation} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex-shrink-0 w-full p-4 border-t bg-background/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-6 sm:gap-8 max-w-sm mx-auto">
                <CarouselPrevious className="static translate-y-0 bg-secondary/80 hover:bg-secondary text-primary h-12 w-12" disabled={!api?.canScrollPrev()}/>
                <p className="text-sm text-muted-foreground font-mono w-16 text-center">
                    {current > 0 ? `${current} / ${faithAffirmations.length}` : '-'}
                </p>
                <CarouselNext className="static translate-y-0 bg-secondary/80 hover:bg-secondary text-primary h-12 w-12" disabled={!api?.canScrollNext()}/>
            </div>
        </div>
      </Carousel>
    </div>
  );
}
