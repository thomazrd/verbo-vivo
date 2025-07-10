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
    if (authLoading) {
      return; // Wait for Firebase auth to initialize
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().onboardingCompleted) {
          router.push("/chat");
        } else {
          // This handles both new signups (where doc exists with false)
          // and cases where the doc might not have been created yet.
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error checking onboarding status, redirecting to chat:", error);
        // Fallback to chat to avoid getting user stuck
        router.push("/chat");
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, router]);

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
