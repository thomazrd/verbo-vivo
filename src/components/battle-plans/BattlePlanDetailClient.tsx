
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import type { BattlePlan, Mission, UserBattlePlan } from "@/lib/types";

import { Loader2, ShieldCheck, Pencil, CheckCircle } from "lucide-react";
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
    
    const userPlanData: UserBattlePlan = {
      id: plan.id,
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

  if (isLoading) {
    return <PlanSkeleton />;
  }
  
  if (!plan) {
    return null; // or a 'not found' component
  }

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
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
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

        <h3 className="text-xl font-bold mt-12 mb-4">Missões do Plano</h3>
        <Accordion type="single" collapsible className="w-full space-y-2">
            {plan.missions
              .sort((a,b) => a.day - b.day)
              .map((mission: Mission) => {
                const isCompleted = userPlan?.completedMissionIds.includes(mission.id);
                return (
                  <AccordionItem value={`item-${mission.day}`} key={mission.id} className={cn("border rounded-lg px-4 bg-muted/30", isCompleted && "border-green-500/30 bg-green-500/5")}>
                    <AccordionTrigger>
                       <div className="flex items-center gap-4 w-full">
                          <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0", isCompleted && "bg-green-500/20 text-green-700")}>
                              {isCompleted ? <CheckCircle className="h-5 w-5"/> : mission.day}
                          </div>
                          <span className={cn("font-semibold text-left", isCompleted && "line-through text-muted-foreground")}>{mission.title}</span>
                       </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="border-t -mx-4 px-4 pt-4 pb-2">
                           <p className="text-muted-foreground">{mission.leaderNote || "Nenhuma nota adicional do líder."}</p>
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
