
"use client";

import type { BattlePlan, UserBattlePlan } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap } from "lucide-react";
import { BattlePlanCard } from "./BattlePlanCard";

interface BattlePlanListProps {
  plans: (UserBattlePlan | BattlePlan)[];
  isLoading: boolean;
  isUserPlans: boolean;
}

export function BattlePlanList({ plans, isLoading, isUserPlans }: BattlePlanListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border bg-card rounded-lg overflow-hidden">
            <Skeleton className="w-full aspect-video" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center h-96">
        <GraduationCap className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">
          {isUserPlans ? "Nenhum plano iniciado" : "Nenhum plano disponível"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {isUserPlans ? "Vá para a aba 'Explorar' para encontrar um novo desafio." : "Novos planos de batalha aparecerão aqui em breve."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <BattlePlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  );
}
