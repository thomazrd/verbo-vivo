"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface RankIndicatorProps {
  rankName: string;
  Icon: LucideIcon;
  iconColor: string;
  isCollapsed: boolean;
}

export function RankIndicator({ rankName, Icon, iconColor, isCollapsed }: RankIndicatorProps) {

    if (isCollapsed) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <div className="w-full h-12 flex items-center justify-center">
                            <Icon className={cn("h-7 w-7", iconColor)} />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="font-semibold">{rankName}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all bg-accent/10 border-t border-b border-accent/20 mx-2 my-2">
      <Icon className={cn("h-8 w-8", iconColor)} />
      <div className='flex flex-col'>
        <span className="text-sm text-foreground/80">Sua Patente</span>
        <span className="text-base font-bold text-foreground">{rankName}</span>
      </div>
    </div>
  );
}
