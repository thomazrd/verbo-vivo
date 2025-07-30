
"use client";

import type { BattlePlan, UserBattlePlan } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BattlePlanCardProps {
  plan: BattlePlan | UserBattlePlan;
}

function isUserBattlePlan(plan: any): plan is UserBattlePlan {
  return plan.hasOwnProperty('progressPercentage');
}

export function BattlePlanCard({ plan }: BattlePlanCardProps) {
  const userPlan = isUserBattlePlan(plan) ? plan : null;
  const basePlan = isUserBattlePlan(plan) ? { 
      id: plan.planId, 
      title: plan.planTitle, 
      coverImageUrl: plan.planCoverImageUrl, 
      creatorName: plan.planCreatorId 
    } : plan as BattlePlan;

  const linkHref = isUserBattlePlan(plan) ? `/battle-plans/mission/${plan.id}` : `/battle-plans/${plan.id}`;

  return (
    <Link href={linkHref} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg">
        <div className="aspect-video overflow-hidden relative bg-muted">
          <Image
            src={basePlan.coverImageUrl || "https://placehold.co/600x400.png"}
            alt={basePlan.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="battle plan training"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <CardHeader className="flex-grow">
          <CardTitle className="text-base font-semibold line-clamp-2">
            {basePlan.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 pt-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">
              Criado por: {basePlan.creatorName || 'Verbo Vivo'}
            </p>
          </div>
        </CardHeader>
        {userPlan && (
          <CardFooter className="pt-0 pb-4 px-4">
            <div className="w-full">
                <Progress value={userPlan.progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground text-right mt-1">{Math.round(userPlan.progressPercentage)}%</p>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
