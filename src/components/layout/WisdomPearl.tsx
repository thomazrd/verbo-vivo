
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WisdomPearl as WisdomPearlType } from '@/lib/types';
import { cn } from '@/lib/utils';

// Static data to simulate API response, ensuring the component always has data to display.
const predefinedPearls: WisdomPearlType[] = [
    { id: '1', text: 'O coração alegre aformoseia o rosto.', reference: 'Provérbios 15:13', bookAbbrev: 'pv', chapter: 15 },
    { id: '2', text: 'Aquietai-vos e sabei que eu sou Deus.', reference: 'Salmos 46:10', bookAbbrev: 'sl', chapter: 46 },
    { id: '3', text: 'O Senhor é a minha força e o meu escudo.', reference: 'Salmos 28:7', bookAbbrev: 'sl', chapter: 28 },
    { id: '4', text: 'Tudo tem o seu tempo determinado.', reference: 'Eclesiastes 3:1', bookAbbrev: 'ec', chapter: 3 },
];

export function WisdomPearl() {
  const [pearl, setPearl] = useState<WisdomPearlType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Select a random pearl from the predefined list
    const randomPearl = predefinedPearls[Math.floor(Math.random() * predefinedPearls.length)];
    // Simulate a short loading time
    setTimeout(() => {
        setPearl(randomPearl);
        setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return <div className="hidden lg:flex items-center justify-start flex-1 ml-4"><Skeleton className="h-4 w-72" /></div>;
  }
  
  if (!pearl) {
    return null; // Don't render if there's no pearl for some reason
  }

  const bibleLink = `/bible?book=${pearl.bookAbbrev}&chapter=${pearl.chapter}`;

  return (
    <div className={cn(
        "hidden lg:flex items-center justify-start flex-1 ml-4 transition-opacity duration-500",
        !isLoading ? "opacity-100" : "opacity-0"
    )}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link 
              href={bibleLink} 
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              "{pearl.text}"
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver contexto em {pearl.reference}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
