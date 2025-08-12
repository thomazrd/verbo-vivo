
"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Button } from '../ui/button';

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
                        <div className="px-2 py-2">
                            <Button variant="ghost" size="icon" className="w-full h-auto p-2">
                                <Icon className={cn("h-6 w-6", iconColor)} />
                            </Button>
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
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all bg-accent/10 mx-2 my-1">
      <Icon className={cn("h-6 w-6 shrink-0", iconColor)} />
      <div className='flex flex-col'>
        <span className="text-xs text-foreground/80">Nível</span>
        <span className="text-base font-bold text-foreground leading-tight">{rankName}</span>
      </div>
    </div>
  );
}
