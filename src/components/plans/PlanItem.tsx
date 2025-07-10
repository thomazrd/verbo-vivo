"use client";

import Link from "next/link";
import { Plan } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookCheck, ChevronRight } from "lucide-react";

interface PlanItemProps {
  plan: Plan;
}

export function PlanItem({ plan }: PlanItemProps) {
  const completedTasks = plan.tasks.filter((task) => task.completed).length;
  const totalTasks = plan.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Link href={`/plans/${plan.id}`} className="block">
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BookCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{plan.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedTasks} de {totalTasks} dias concluídos
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        {totalTasks > 0 && (
          <CardContent className="pt-0">
             <Progress value={progress} className="h-2" />
          </CardContent>
        )}
      </Card>
    </Link>
  );
}
