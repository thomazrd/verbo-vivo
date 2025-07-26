
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, BookHeart } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication check is complete
    if (authLoading) {
      return;
    }

    // If the check is done and there's no user, redirect to login.
    // This is the primary entry point for unauthenticated users.
    if (!user) {
      router.replace("/login");
      return;
    }

    // If there is a user, check their onboarding status to direct them correctly.
    const checkOnboardingStatus = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().onboardingCompleted) {
          router.replace("/home");
        } else {
          // This handles new sign-ups or cases where the doc might not be created yet.
          router.replace("/onboarding");
        }
      } catch (error) {
        console.error("Error checking onboarding status, redirecting to home as a fallback:", error);
        router.replace("/home");
      }
    };

    checkOnboardingStatus();
    
  }, [user, authLoading, router]);

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
