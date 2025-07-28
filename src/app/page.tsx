
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, BookHeart } from "lucide-react";

export default function Home() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication check and profile fetch is complete.
    if (authLoading) {
      return;
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
    
  }, [user, userProfile, authLoading, router]);

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
