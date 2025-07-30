
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Loader2, BookHeart } from "lucide-react";
import { MissionCompletionModal } from "@/components/battle-plans/MissionCompletionModal";


function HomePageContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

  useEffect(() => {
    const missionId = searchParams.get('missionCompleted');
    if (missionId) {
      setMissionToComplete(missionId);
    }
  }, [searchParams]);

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
    
    // Redirect logic should only run if the modal is not active.
    if (userProfile && !missionToComplete) {
       if (userProfile.onboardingCompleted) {
         router.replace("/home");
       } else {
         router.replace("/onboarding");
       }
    } else if (!userProfile && !missionToComplete) {
        // This case can happen for a brand new user whose document hasn't been created yet.
        // Directing to onboarding is a safe default, as it will create the user document.
        router.replace("/onboarding");
    }
    
  }, [user, userProfile, authLoading, router, missionToComplete]);
  
  const handleModalClose = () => {
    setMissionToComplete(null);
    router.replace('/home', { scroll: false }); // Clean URL after modal is closed
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
        <Suspense fallback={<div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>}>
            <HomePageContent />
        </Suspense>
    )
}
