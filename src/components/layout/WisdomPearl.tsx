
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { WisdomPearl as WisdomPearlType } from '@/lib/types';
import { cn } from '@/lib/utils';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export function WisdomPearl() {
  // Use SWR for fetching, caching, and revalidation logic.
  // This will fetch the data once per session and reuse it on navigation.
  const { data: pearl, error, isLoading } = useSWR<WisdomPearlType>(
    '/api/wisdom-pearl/random',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false, // Don't retry on error to avoid breaking layout
    }
  );

  // Use a state to control fade-in animation to avoid flash of old content if SWR revalidates
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    if (pearl) {
      setIsMounted(true);
    }
  }, [pearl]);


  if (isLoading) {
    return <div className="hidden lg:flex items-center justify-start flex-1 ml-4"><Skeleton className="h-4 w-72" /></div>;
  }
  
  if (error || !pearl) {
    return null; // Don't render anything on error, as per TDD.
  }

  const bibleLink = `/bible?book=${pearl.bookAbbrev}&chapter=${pearl.chapter}`;

  return (
    <div className={cn(
        "hidden lg:flex items-center justify-start flex-1 ml-4 transition-opacity duration-500",
        isMounted ? "opacity-100" : "opacity-0"
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
