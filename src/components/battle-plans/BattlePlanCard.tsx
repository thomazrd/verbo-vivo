
"use client";

import type { BattlePlan, UserBattlePlan } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, MoreVertical, Pencil, Trash2, Loader2, CalendarDays, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { useState } from "react";
import { deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface BattlePlanCardProps {
  plan: BattlePlan | UserBattlePlan;
}

function isUserBattlePlan(plan: any): plan is UserBattlePlan {
  return plan.hasOwnProperty('progressPercentage');
}

export function BattlePlanCard({ plan }: BattlePlanCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const userPlan = isUserBattlePlan(plan) ? plan : null;
  const basePlan = userPlan 
      ? { 
          id: plan.planId, 
          title: plan.planTitle, 
          coverImageUrl: plan.planCoverImageUrl,
          creatorName: (plan as any).creatorName,
          creatorId: plan.planCreatorId,
          durationDays: (plan as any).durationDays, // Pass through duration
          missions: [] // Mission count not available on UserBattlePlan
        } 
      : plan as BattlePlan;

  const linkHref = isUserBattlePlan(plan) ? `/battle-plans/mission/${plan.id}` : `/battle-plans/${plan.id}`;
  const isCreator = user?.uid === basePlan.creatorId;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isCreator || !basePlan.id || !user) return;
    
    setIsDeleting(true);
    try {
        const batch = writeBatch(db);
        const planRef = doc(db, 'battlePlans', basePlan.id);
        batch.delete(planRef);

        // Also delete the user's progress for this plan if it exists
        const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, basePlan.id);
        batch.delete(userPlanRef);

        await batch.commit();
        
        toast({ title: 'Plano Desmontado', description: `O plano "${basePlan.title}" foi excluído com sucesso.`});
        setIsAlertOpen(false); // Fecha o modal
    } catch (error) {
        console.error("Error deleting battle plan:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o plano.'});
    } finally {
        setIsDeleting(false);
    }
  }

  const missionCount = (plan as BattlePlan).missions?.length;

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
            <div className="flex justify-between items-start">
              <CardTitle className="text-base font-semibold line-clamp-2">
                {basePlan.title}
              </CardTitle>
              {isCreator && (
                <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      <DropdownMenuItem onClick={() => window.location.href = `/battle-plans/edit/${basePlan.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setIsAlertOpen(true)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4"/>
                          Desmontar Plano
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                   <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Desmontar Plano?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta ação é permanente e não pode ser desfeita. Todos os dados associados a este plano serão excluídos.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                            {isDeleting && <Loader2 className="animate-spin mr-2"/>}
                            Desmontar
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="flex items-center gap-1.5 pt-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-muted-foreground">
                Criado por: {basePlan.creatorName || 'Verbo Vivo'}
                </p>
            </div>
            {!userPlan && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        <span>{(plan as BattlePlan).durationDays} dias</span>
                    </div>
                     <div className="flex items-center gap-1.5">
                        <ListTodo className="h-4 w-4" />
                        <span>{missionCount} missões</span>
                    </div>
                </div>
            )}
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
