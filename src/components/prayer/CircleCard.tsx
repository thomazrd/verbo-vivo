
"use client";

import { useState } from "react";
import Link from "next/link";
import { PrayerCircle } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ChevronRight, Award } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { VictoryModal } from "./VictoryModal";

interface CircleCardProps {
  circle: PrayerCircle;
}

export function CircleCard({ circle }: CircleCardProps) {
  const { user } = useAuth();
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const isModerator = user?.uid === circle.createdBy;

  return (
    <>
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <div className="p-4 sm:p-5 flex justify-between items-center">
          <Link href={`/prayer-circles/${circle.id}`} className="flex-1 min-w-0 group">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">{circle.name}</p>
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
          </Link>
          {isModerator && (
            <div className="pl-4 ml-4 border-l">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                onClick={() => setIsVictoryModalOpen(true)}
              >
                <Award className="mr-2 h-4 w-4" />
                Vitória
              </Button>
            </div>
          )}
        </div>
      </Card>
      {isModerator && (
        <VictoryModal
          isOpen={isVictoryModalOpen}
          onClose={() => setIsVictoryModalOpen(false)}
          circle={circle}
        />
      )}
    </>
  );
}
