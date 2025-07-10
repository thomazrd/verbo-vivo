"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Plan, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface PlanDetailClientProps {
  planData: Plan;
}

export function PlanDetailClient({ planData }: PlanDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState(planData);

  const completedTasks = plan.tasks.filter((task) => task.completed).length;
  const totalTasks = plan.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskToggle = async (taskDay: number) => {
    if (!user) return;

    const updatedTasks = plan.tasks.map(task => 
      task.day === taskDay ? { ...task, completed: !task.completed } : task
    );
    
    // Optimistic UI update
    setPlan(prevPlan => ({...prevPlan, tasks: updatedTasks}));

    try {
      const planRef = doc(db, `users/${user.uid}/plans`, plan.id);
      await updateDoc(planRef, { tasks: updatedTasks });
    } catch (error) {
      console.error("Error updating task:", error);
      // Revert on error
      setPlan(planData);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a tarefa. Tente novamente."
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight md:text-3xl">{plan.title}</CardTitle>
          <CardDescription className="pt-2">
            Complete as tarefas diárias para aprofundar seu entendimento.
          </CardDescription>
          <div className="pt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{completedTasks} de {totalTasks} dias concluídos.</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plan.tasks
              .sort((a, b) => a.day - b.day)
              .map((task: Task) => (
              <div
                key={task.day}
                className={cn(
                  "flex items-start space-x-4 rounded-lg border p-4 transition-colors",
                  task.completed && "bg-muted/50 border-primary/30"
                )}
              >
                <Checkbox
                  id={`task-${task.day}`}
                  checked={task.completed}
                  onCheckedChange={() => handleTaskToggle(task.day)}
                  className="mt-1 h-5 w-5"
                  aria-label={`Marcar dia ${task.day} como concluído`}
                />
                <div className="grid gap-1.5">
                  <Label htmlFor={`task-${task.day}`} className={cn("text-base font-semibold", task.completed && "line-through text-muted-foreground")}>
                    Dia {task.day}: <span className="font-mono font-normal">{task.verseReference}</span>
                  </Label>
                  <p className={cn("text-sm text-muted-foreground", task.completed && "line-through")}>
                    {task.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
