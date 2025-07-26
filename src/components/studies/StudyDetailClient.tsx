
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import type { Study } from "@/lib/types";

import { AudioPlayer } from "@/components/studies/AudioPlayer";
import { StudyContentAccordion } from "@/components/studies/StudyContentAccordion";
import { RelatedContentList } from "@/components/studies/RelatedContentList";
import { useAuth } from "@/hooks/use-auth";
import { useContentAccess } from "@/hooks/use-content-access";
import { AccessModal } from "@/components/auth/AccessModal";
import { ArrowLeft, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { HomePageSkeleton } from "../home/HomePageSkeleton";

interface StudyDetailClientProps {
  study: Study;
}

export function StudyDetailClient({ study }: StudyDetailClientProps) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  
  const shouldCheckAccess = !authLoading && !user;
  const { canView, isLoading: isAccessLoading } = useContentAccess(study.id, shouldCheckAccess);
  
  useEffect(() => {
    if (authLoading || isAccessLoading) return;

    if (!canView) {
      setIsAccessModalOpen(true);
    } else {
        // Increment view count only if user can view
        const studyRef = doc(db, "studies", study.id);
        updateDoc(studyRef, { viewCount: increment(1) }).catch(console.error);
    }
  }, [study.id, canView, isAccessLoading, authLoading]);

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

  if (authLoading || isAccessLoading) {
    return <HomePageSkeleton />;
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
      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </>
  );
}
