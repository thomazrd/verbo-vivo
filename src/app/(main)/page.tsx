
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, BookHeart } from "lucide-react";

export default function RootRedirectPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) {
      return; // Aguarde o carregamento terminar no layout.
    }

    if (!user) {
      router.replace("/login");
    } else if (userProfile) {
      if (userProfile.onboardingCompleted) {
        // A lógica principal de redirecionamento está agora no layout.
        // Este é um fallback caso o usuário acesse a rota raiz diretamente.
        router.replace("/home");
      } else {
        router.replace("/onboarding");
      }
    }
    // Se userProfile ainda não carregou, o layout cuidará do redirecionamento
    // para o onboarding ou exibirá o loader.
  }, [user, userProfile, authLoading, router]);

  // Renderiza um estado de carregamento enquanto a lógica acima decide para onde redirecionar.
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
