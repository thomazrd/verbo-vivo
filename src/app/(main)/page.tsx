
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, BookHeart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MissionCompletionModal } from "@/components/battle-plans/MissionCompletionModal";


function HomePageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

  useEffect(() => {
    const missionId = searchParams.get('missionCompleted');
    if (missionId) {
      setMissionToComplete(missionId);
      // Clean URL after capturing the mission ID, but keep the modal state
      router.replace('/home', { scroll: false }); 
    }
  }, [searchParams, router]);

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
       // Do not redirect if a mission modal needs to be shown
       if (userProfile.onboardingCompleted && !missionToComplete) {
         router.replace("/home");
       } else if (!userProfile.onboardingCompleted) {
         router.replace("/onboarding");
       }
    } else {
        router.replace("/onboarding");
    }
    
  }, [user, userProfile, authLoading, router, missionToComplete]);
  
  const handleModalClose = () => {
    setMissionToComplete(null);
    router.replace('/home', { scroll: false });
  }

  // Render a loading state while the logic in useEffect determines the correct route.
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
      
      {missionToComplete && (
        <MissionCompletionModal 
            userPlanId={missionToComplete}
            onClose={handleModalClose}
        />
      )}
    </>
  );
}

export default function Home() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <HomePageContent />
        </Suspense>
    )
}
