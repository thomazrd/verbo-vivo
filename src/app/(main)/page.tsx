
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2, BookHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, writeBatch } from "firebase/firestore";
import type { BattlePlan, UserBattlePlan, Mission } from "@/lib/types";
import { differenceInDays, startOfDay } from "date-fns";

async function completeMission(userId: string, userPlanId: string) {
    if (!userId || !userPlanId) return { success: false, error: 'User or Plan ID missing.'};

    const userPlanRef = doc(db, `users/${userId}/battlePlans`, userPlanId);
    
    try {
        const result = await db.runTransaction(async (transaction) => {
            const userPlanSnap = await transaction.get(userPlanRef);
            if (!userPlanSnap.exists()) {
                throw new Error("Progresso do plano não encontrado.");
            }
            
            const userPlan = { id: userPlanSnap.id, ...userPlanSnap.data() } as UserBattlePlan;
            
            const planDefRef = doc(db, "battlePlans", userPlan.planId);
            const planDefSnap = await transaction.get(planDefRef);
            if (!planDefSnap.exists()) {
                throw new Error("Definição do plano não encontrada.");
            }
            const planDef = planDefSnap.data() as BattlePlan;

            const today = startOfDay(new Date());
            const planStartDate = startOfDay(userPlan.startDate.toDate());
            const currentDayOfPlan = differenceInDays(today, planStartDate) + 1;

            const todaysMission = planDef.missions.find(m => m.day === currentDayOfPlan);

            if (!todaysMission || userPlan.completedMissionIds.includes(todaysMission.id)) {
                return { success: true, message: 'Missão já concluída ou não encontrada para hoje.' }; 
            }

            const newCompletedIds = [...userPlan.completedMissionIds, todaysMission.id];
            const newProgress = (newCompletedIds.length / planDef.missions.length) * 100;
            const newStatus = newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS';

            transaction.update(userPlanRef, {
                completedMissionIds: newCompletedIds,
                progressPercentage: newProgress,
                status: newStatus,
            });

            return { success: true, message: 'Missão marcada como concluída!'};
        });
        return result;

    } catch (error: any) {
        console.error("Error completing mission:", error);
        return { success: false, error: error.message };
    }
}


export default function Home() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Wait until the authentication check and profile fetch is complete.
    if (authLoading) {
      return;
    }

    const missionCompletedId = searchParams.get('missionCompleted');
    if (missionCompletedId && user) {
        completeMission(user.uid, missionCompletedId).then(result => {
            if (result.success && result.message) {
                toast({ title: "Sucesso!", description: result.message });
            } else if (result.error) {
                toast({ variant: 'destructive', title: "Erro", description: result.error });
            }
            // Remove query param and navigate to home
            router.replace('/home');
            return; // Exit early to avoid other redirects
        });
    }

    // If the check is done and there's no user, redirect to login.
    // This is the primary entry point for unauthenticated users.
    if (!user) {
      router.replace("/login");
      return;
    }
    
    // If there is a user, we also need to wait for their profile to decide on onboarding.
    // The useAuth hook ensures userProfile is loaded when authLoading is false.
    if (userProfile) {
       if (userProfile.onboardingCompleted) {
         router.replace("/home");
       } else {
         router.replace("/onboarding");
       }
    } else {
        // This case can happen for a brand new user whose document hasn't been created yet.
        // Directing to onboarding is a safe default, as it will create the user document.
        router.replace("/onboarding");
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userProfile, authLoading, router, searchParams]);

  // Render a loading state while the logic in useEffect determines the correct route.
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <div className="flex items-center gap-3 text-primary">
            <BookHeart className="h-10 w-10" />
            <h1 className="text-4xl font-bold tracking-tight">Verbo Vivo</h1>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Carregando sua jornada de fé...</p>
        </div>
    </div>
  );
}
