
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, BookHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, increment, writeBatch, collection } from "firebase/firestore";
import type { BattlePlan, UserBattlePlan, Mission } from "@/lib/types";
import { differenceInDays, startOfDay } from "date-fns";
import { MissionCompletionModal } from "@/components/battle-plans/MissionCompletionModal";


function HomePageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

  useEffect(() => {
    const missionId = searchParams.get('missionCompleted');
    if (missionId === 'true' && user) { // Generic completion signal
      toast({ title: "Missão Concluída!", description: "Seu progresso foi salvo." });
      router.replace('/home');
    } else if (missionId && user) { // Specific mission completion with modal
      setMissionToComplete(missionId);
      router.replace('/home', { scroll: false }); // Clean URL but keep state
    }
  }, [searchParams, user, router, toast]);

  useEffect(() => {
    // Wait until the authentication check and profile fetch is complete.
    if (authLoading) {
      return;
    }

    // If the check is done and there's no user, redirect to login.
    if (!user) {
      router.replace("/login");
      return;
    }
    
    if (userProfile) {
       if (userProfile.onboardingCompleted) {
         // Only redirect if there's no mission completion modal to show
         if (!missionToComplete) {
            router.replace("/home");
         }
       } else {
         router.replace("/onboarding");
       }
    } else {
        router.replace("/onboarding");
    }
    
  }, [user, userProfile, authLoading, router, missionToComplete]);
  
  if (missionToComplete && user) {
    return (
        <>
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
            <MissionCompletionModal 
                userPlanId={missionToComplete}
                onClose={() => setMissionToComplete(null)}
            />
        </>
    );
  }

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

export default function Home() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <HomePageContent />
        </Suspense>
    )
}
