
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import type { BattlePlan, Mission, UserBattlePlan } from "@/lib/types";
import { MissionTypeDetails } from "@/lib/mission-details";

import { Loader2, ShieldCheck, Pencil, CheckCircle, History, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";


function PlanSkeleton() {
    return (
        <div className="container mx-auto max-w-4xl py-8 px-4 animate-pulse">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="mt-8 space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/2" />
            </div>
            <Skeleton className="h-12 w-full mt-8" />
        </div>
    )
}


export function BattlePlanDetailClient({ planId }: { planId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<BattlePlan | null>(null);
  const [userPlan, setUserPlan] = useState<UserBattlePlan | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Fetch the public BattlePlan
  useEffect(() => {
    const planRef = doc(db, "battlePlans", planId);
    const unsub = onSnapshot(planRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlan({ id: docSnap.id, ...docSnap.data() } as BattlePlan);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: 'Plano de Batalha não encontrado.' });
        router.push('/battle-plans');
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [planId, router, toast]);

  // Check if the user has already started this plan
  useEffect(() => {
    if (!user || !plan) return;
    const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, plan.id);
    const unsub = onSnapshot(userPlanRef, (docSnap) => {
        setUserPlan(docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as UserBattlePlan : null);
    });
    return () => unsub();
  }, [user, plan]);

  const handleStartPlan = async (consent: boolean) => {
    if (!user || !plan) return;
    setIsStarting(true);
    
    const userPlanData: Omit<UserBattlePlan, 'id'> = {
      userId: user.uid,
      planId: plan.id,
      planTitle: plan.title,
      planCoverImageUrl: plan.coverImageUrl,
      planCreatorId: plan.creatorId,
      startDate: new Date() as any, // Will be converted by serverTimestamp
      status: 'IN_PROGRESS',
      progressPercentage: 0,
      consentToShareProgress: consent,
      completedMissionIds: [],
    };

    try {
      const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, plan.id);
      await setDoc(userPlanRef, userPlanData);
      
      toast({ title: 'Plano Iniciado!', description: 'Sua primeira missão já está disponível na tela inicial.' });
      router.push('/home');

    } catch (error) {
      console.error("Error starting plan:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível iniciar o plano.' });
    } finally {
        setIsStarting(false);
    }
  }
  
  const hasStartedPlan = userPlan !== null && userPlan !== undefined;
  const isCreator = user?.uid === plan?.creatorId;

  const groupedMissions = useMemo(() => {
    if (!plan) return {};
    return plan.missions.reduce((acc, mission) => {
        (acc[mission.day] = acc[mission.day] || []).push(mission);
        return acc;
    }, {} as Record<number, Mission[]>);
  }, [plan]);

  if (isLoading) {
    return <PlanSkeleton />;
  }
  
  if (!plan) {
    return null; // or a 'not found' component
  }
  
  const areAllMissionsForDayCompleted = (day: number) => {
    const missionsForDay = groupedMissions[day] || [];
    if (missionsForDay.length === 0) return false;
    return missionsForDay.every(m => userPlan?.completedMissionIds.includes(m.id));
  };


  return (
    <div className="container mx-auto max-w-3xl pb-12">
      <div className="relative w-full h-64 sm:h-80 rounded-b-lg overflow-hidden shadow-lg">
        <Image
          src={plan.coverImageUrl}
          alt={plan.title}
          fill
          className="object-cover"
          priority
          data-ai-hint="training plan cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {isCreator && (
            <Button asChild className="absolute top-4 right-4 z-10">
                <Link href={`/battle-plans/edit/${plan.id}`}>
                    <Pencil className="mr-2 h-4 w-4"/>
                    Editar
                </Link>
            </Button>
        )}
      </div>
      <div className="px-4 -mt-16 relative z-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
          {plan.title}
        </h1>
        <p className="mt-2 text-white/90">Um treinamento de {plan.durationDays} dias.</p>
        <p className="text-sm text-white/80">Criado por: {plan.creatorName}</p>

        <p className="mt-8 text-lg text-foreground/80 leading-relaxed">{plan.description}</p>
        
        {hasStartedPlan ? (
             <Button size="lg" className="w-full mt-8" onClick={() => router.push(`/battle-plans/mission/${plan.id}`)}>
                Continuar Treinamento
            </Button>
        ): (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="lg" className="w-full mt-8" disabled={isStarting}>
                        {isStarting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Iniciar este Plano de Batalha
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><ShieldCheck/> Consentimento de Acompanhamento</AlertDialogTitle>
                        <AlertDialogDescription>
                           O criador deste plano, <span className="font-semibold">{plan.creatorName}</span>, poderá ver seu progresso (Ex: "Em Andamento" ou "Concluído") para orar por você. Seus dados detalhados, como sentimentos registrados, permanecem 100% privados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-between sm:flex-row-reverse gap-2">
                        <AlertDialogAction onClick={() => handleStartPlan(true)}>Aceitar e Iniciar</AlertDialogAction>
                        <AlertDialogCancel asChild>
                           <Button variant="outline" onClick={() => handleStartPlan(false)}>Iniciar de Forma Privada</Button>
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}

        <h3 className="text-xl font-bold mt-12 mb-4">Mural de Missões</h3>
        <Accordion type="single" collapsible className="w-full space-y-2">
           {Object.keys(groupedMissions).map(day => {
              const dayNumber = parseInt(day, 10);
              const missionsForDay = groupedMissions[dayNumber];
              const allCompleted = areAllMissionsForDayCompleted(dayNumber);
              return (
                <AccordionItem value={`day-${dayNumber}`} key={dayNumber} className="border rounded-lg px-4 bg-muted/30 data-[state=open]:border-primary/50">
                   <AccordionTrigger>
                       <div className="flex items-center gap-4 w-full">
                          <div className={cn("flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm shrink-0", allCompleted ? "bg-green-500/20 text-green-700" : "bg-primary/10 text-primary")}>
                              {allCompleted ? <CheckCircle className="h-5 w-5"/> : dayNumber}
                          </div>
                          <span className={cn("font-semibold text-left", allCompleted && "line-through text-muted-foreground")}>Dia {dayNumber}</span>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="border-t -mx-4 px-4 pt-4 pb-2 space-y-3">
                            {missionsForDay.map(mission => {
                                const MissionIcon = MissionTypeDetails[mission.type]?.icon;
                                const isCompleted = userPlan?.completedMissionIds.includes(mission.id);
                                return (
                                    <div key={mission.id} className="p-3 border rounded-md bg-background">
                                        <div className="flex justify-between items-start">
                                            <p className={cn("font-semibold text-sm", isCompleted && "line-through text-muted-foreground")}>{mission.title}</p>
                                            {isCompleted && <Check className="h-4 w-4 text-green-500 shrink-0 ml-2" />}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                            {MissionIcon && <MissionIcon className="h-3 w-3"/>}
                                            <span>{MissionTypeDetails[mission.type].label}</span>
                                        </div>
                                        {mission.leaderNote && (
                                            <p className="text-xs text-muted-foreground italic mt-2 border-t pt-2">Nota: {mission.leaderNote}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </AccordionContent>
                </AccordionItem>
              )
           })}
        </Accordion>
      </div>
    </div>
  );
}
