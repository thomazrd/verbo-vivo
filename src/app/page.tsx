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
    // Aguarda a conclusão do carregamento do estado de autenticação
    if (authLoading) {
      return; 
    }

    // Se o carregamento terminou e não há usuário, redireciona para o login
    if (!user) {
      router.push("/login");
      return;
    }

    // Se há um usuário, verifica o status de onboarding
    const checkOnboardingStatus = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().onboardingCompleted) {
          router.push("/chat");
        } else {
          // Isso lida com novos cadastros (onde o doc existe com 'false')
          // e casos onde o documento pode ainda não ter sido criado.
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Erro ao verificar o status de onboarding, redirecionando para o chat:", error);
        // Fallback para o chat para evitar que o usuário fique preso
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
