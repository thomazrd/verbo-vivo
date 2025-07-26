
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Plan, Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VerseViewer } from './VerseViewer';

interface PlanDetailClientProps {
  planData: Plan;
}

export function PlanDetailClient({ planData }: PlanDetailClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState(planData);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | null>(null);

  const completedTasks = plan.tasks.filter((task) => task.completed).length;
  const totalTasks = plan.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleTaskToggle = async (taskDay: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Impede que o clique no checkbox abra/feche o acordeão
    if (!user) return;

    const updatedTasks = plan.tasks.map(task => 
      task.day === taskDay ? { ...task, completed: !task.completed } : task
    );
    
    setPlan(prevPlan => ({...prevPlan, tasks: updatedTasks}));

    try {
      const planRef = doc(db, `users/${user.uid}/plans`, plan.id);
      await updateDoc(planRef, { tasks: updatedTasks });
    } catch (error) {
      console.error("Error updating task:", error);
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
            Complete as tarefas diárias para aprofundar seu entendimento. Clique em um dia para ler os versículos.
          </CardDescription>
          <div className="pt-4 space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{completedTasks} de {totalTasks} dias concluídos.</p>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion 
            type="single" 
            collapsible 
            className="w-full space-y-2"
            value={activeAccordionItem || ""}
            onValueChange={setActiveAccordionItem}
          >
            {plan.tasks
              .sort((a, b) => a.day - b.day)
              .map((task: Task) => (
              <AccordionItem value={`item-${task.day}`} key={task.day} className="border rounded-lg px-4 has-[[data-state=open]]:border-primary/50">
                <AccordionTrigger className="py-0 hover:no-underline">
                   <div className="flex items-center gap-4 py-4 w-full">
                     <Checkbox
                        id={`task-${task.day}`}
                        checked={task.completed}
                        onClick={(e) => handleTaskToggle(task.day, e)}
                        className="h-5 w-5"
                        aria-label={`Marcar dia ${task.day} como concluído`}
                      />
                      <div className="grid gap-1.5 text-left">
                        <p className={cn("text-base font-semibold", task.completed && "line-through text-muted-foreground")}>
                          Dia {task.day}: <span className="font-mono font-normal">{task.verseReference}</span>
                        </p>
                        <p className={cn("text-sm text-muted-foreground", task.completed && "line-through")}>
                          {task.description}
                        </p>
                      </div>
                   </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="border-t -mx-4 px-4 pt-4 pb-2">
                       <VerseViewer 
                          verseReference={task.verseReference}
                          isOpen={activeAccordionItem === `item-${task.day}`}
                       />
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
