
"use client";

import { useState } from 'react';
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
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
      <motion.div
        key={title}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-background/80 backdrop-blur-sm border-primary/20 shadow-lg text-center min-h-[50vh] flex flex-col justify-between">
          <div>
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
          <div className="bg-muted/50 p-4 mt-6 border-t">
              <p className="text-xs text-muted-foreground mb-2 font-semibold">Fundamento Bíblico</p>
              <div className="text-sm text-foreground/80">
                <p className="italic">"{verseText}"</p>
                <p className="font-bold text-primary/80 mt-1">{verseReference}</p>
              </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default function FaithConfessionPage() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => setCurrent(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="h-full w-full overflow-hidden bg-gray-900 bg-gradient-to-br from-background via-gray-900 to-background text-foreground flex flex-col items-center justify-center">
      <Carousel setApi={setApi} className="w-full max-w-5xl h-full flex flex-col items-center justify-center">
        <CarouselContent className="ml-0 h-full">
          <CarouselItem key="intro" className="p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl"
            >
              <HandHeart className="h-20 w-20 text-primary mx-auto mb-6" />
              <h1 className="text-4xl font-extrabold tracking-tight">Confissão de Fé</h1>
              <blockquote className="mt-8 p-6 border-l-4 border-primary bg-muted/50 rounded-r-lg">
                <p className="font-serif italic text-2xl text-foreground">"{introVerse.text}"</p>
                <footer className="text-right text-lg font-semibold text-primary/80 mt-4 not-italic">— {introVerse.reference}</footer>
              </blockquote>
              <Button onClick={() => api?.scrollNext()} size="lg" className="mt-12">
                Começar a Declarar
              </Button>
            </motion.div>
          </CarouselItem>
          {faithAffirmations.map((affirmation) => (
            <CarouselItem key={affirmation.title} className="p-2 sm:p-4 md:p-6 lg:p-8">
              <AffirmationCard {...affirmation} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8">
            <CarouselPrevious className="static translate-y-0 bg-secondary/80 hover:bg-secondary text-primary h-12 w-12" disabled={!api?.canScrollPrev()}/>
            <p className="text-sm text-muted-foreground font-mono">
                {current} / {faithAffirmations.length}
            </p>
            <CarouselNext className="static translate-y-0 bg-secondary/80 hover:bg-secondary text-primary h-12 w-12" disabled={!api?.canScrollNext()}/>
        </div>
      </Carousel>
    </div>
  );
}
