
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment, onSnapshot, getDoc } from "firebase/firestore";
import type { Study } from "@/lib/types";

import { AudioPlayer } from "@/components/studies/AudioPlayer";
import { StudyContentAccordion } from "@/components/studies/StudyContentAccordion";
import { RelatedContentList } from "@/components/studies/RelatedContentList";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HomePageSkeleton } from "../home/HomePageSkeleton";
import { ReactionButtons } from "./ReactionButtons";

interface StudyDetailClientProps {
  initialStudy: Partial<Study>; // Now accepts a partial study object
}

export function StudyDetailClient({ initialStudy }: StudyDetailClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!initialStudy.id) return;
    
    // Listener for real-time updates (reactions, etc.)
    const unsub = onSnapshot(doc(db, "studies", initialStudy.id), (doc) => {
      if (doc.exists() && doc.data().status === 'PUBLISHED') {
        setStudy({ id: doc.id, ...doc.data() } as Study);
        setIsLoading(false);
      } else {
        // Handle case where study is not found or not published
        setIsLoading(false);
        setStudy(null);
      }
    });

    return () => unsub();
  }, [initialStudy.id]);
  
  useEffect(() => {
    if (!study) return;
    // Increment view count. We only do this once per session.
    const viewedKey = `viewed-${study.id}`;
    if (!sessionStorage.getItem(viewedKey)) {
      const studyRef = doc(db, "studies", study.id);
      updateDoc(studyRef, { viewCount: increment(1) }).catch(console.error);
      sessionStorage.setItem(viewedKey, 'true');
    }
  }, [study]);

  const handleShare = async () => {
    if (!study) return;
    const shareData = {
      title: `Estudo: ${study.title}`,
      text: `Confira este estudo edificante do Verbo Vivo: ${study.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copiado!",
          description: "O link para este estudo foi copiado para sua área de transferência.",
        });
      }
    } catch (error: any) {
        if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
            console.error('Error sharing study:', error);
            toast({
                variant: "destructive",
                title: "Erro ao compartilhar",
                description: "Não foi possível compartilhar este estudo.",
            });
        }
    }
  };

  if (isLoading || authLoading) {
    return <HomePageSkeleton />;
  }
  
  if (!study) {
    return (
        <div className="container mx-auto text-center py-10">
            <h1 className="text-2xl font-bold">Estudo não encontrado</h1>
            <p className="text-muted-foreground">Este estudo pode ter sido removido ou não está mais disponível.</p>
            <Button variant="link" onClick={() => router.push('/studies')}>Ver outros estudos</Button>
        </div>
    )
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex justify-between items-center mb-4">
            <Button
                variant="ghost"
                onClick={() => router.back()}
                className="md:hidden"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
            <div className="flex-grow md:hidden" />
             <Button
                size="sm"
                onClick={handleShare}
                className="bg-accent text-accent-foreground hover:bg-accent/90 ml-auto"
            >
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
            </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8">
            
            <div className="lg:col-span-2 space-y-8">
                <div className="w-full">
                    <AudioPlayer study={study} />
                </div>

                <ReactionButtons study={study} user={user} />

                <StudyContentAccordion 
                    markdownContent={study.content}
                    practicalChallenge={study.practicalChallenge}
                />
            </div>

            <aside className="lg:col-span-1 space-y-6">
                 <h2 className="text-xl font-bold tracking-tight">Próximos Estudos</h2>
                 <RelatedContentList
                    user={user}
                    currentStudyId={study.id}
                    tags={study.tags}
                 />
            </aside>

        </div>
      </div>
    </>
  );
}
