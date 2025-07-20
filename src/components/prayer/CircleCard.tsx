
"use client";

import Link from "next/link";
import { PrayerCircle } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CircleCardProps {
  circle: PrayerCircle;
}

export function CircleCard({ circle }: CircleCardProps) {

  return (
    <Link href={`/prayer-circles/${circle.id}`} className="block group">
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <div className="p-4 sm:p-5 flex justify-between items-center">
            <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-foreground truncate">{circle.name}</p>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                    <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" />
                        <span>{circle.members.length} membro(s)</span>
                    </div>
                     <span className="hidden sm:inline">•</span>
                    <span>Criado por {circle.authorName}</span>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}
