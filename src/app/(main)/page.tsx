
"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, BookHeart } from "lucide-react";

export default function Home() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Não faça nada até que o estado de autenticação e o perfil estejam totalmente carregados.
    if (authLoading) {
      return;
    }

    // Se, após o carregamento, não houver usuário, envie para o login.
    if (!user) {
      router.replace("/login");
      return;
    }
    
    // Se, após o carregamento, houver um usuário, mas ainda nenhum perfil (caso de criação de conta),
    // o hook useAuth irá carregar o perfil. Se o perfil for carregado e existir:
    if (userProfile) {
       if (userProfile.onboardingCompleted) {
         router.replace("/home");
       } else {
         router.replace("/onboarding");
       }
    }
    // Se authLoading for falso, e user existir, mas userProfile for null, 
    // significa que o documento do Firestore pode não existir.
    // O onboarding é o lugar para criar/confirmar esse documento.
    else if (!authLoading && user && !userProfile) {
      router.replace('/onboarding');
    }
    
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
