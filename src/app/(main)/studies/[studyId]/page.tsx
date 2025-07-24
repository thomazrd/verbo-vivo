
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { Study } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";
import { AudioPlayer } from "@/components/studies/AudioPlayer";
import { StudyContentAccordion } from "@/components/studies/StudyContentAccordion";
import { RelatedContentList } from "@/components/studies/RelatedContentList";
import { useAuth } from "@/hooks/use-auth";
import { useContentAccess } from "@/hooks/use-content-access";
import { AccessModal } from "@/components/auth/AccessModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function getStudy(id: string): Promise<Study | null> {
  const docRef = doc(db, "studies", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().status === 'PUBLISHED') {
    return { id: docSnap.id, ...docSnap.data() } as Study;
  }
  return null;
}

export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.studyId as string;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [study, setStudy] = useState<Study | null | 'not-found'>(null);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  
  const shouldCheckAccess = !authLoading && !user;
  const { canView, isLoading: isAccessLoading } = useContentAccess(studyId, shouldCheckAccess);
  
  useEffect(() => {
    if (authLoading || isAccessLoading) return;

    if (!canView) {
      setIsAccessModalOpen(true);
    }
    
    if (studyId) {
      getStudy(studyId).then(data => {
        setStudy(data || 'not-found');
      });
    }
  }, [studyId, canView, isAccessLoading, authLoading]);

  const handleShare = async () => {
    if (!study || study === 'not-found') return;
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
        if (error.name !== 'NotAllowedError') {
            console.error('Error sharing study:', error);
            toast({
                variant: "destructive",
                title: "Erro ao compartilhar",
                description: "Não foi possível compartilhar este estudo.",
            });
        }
    }
  };


  if (study === 'not-found') {
    notFound();
  }
  
  if (study === null || authLoading || isAccessLoading) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="w-full h-28 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
                <div className="lg:col-span-1 space-y-4">
                     <Skeleton className="h-8 w-1/2 mb-4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            </div>
        </div>
    );
  }
  
  const authorInitial = study.authorName?.[0]?.toUpperCase() || <User className="h-5 w-5"/>;

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8">
            
            <div className="lg:col-span-2 space-y-8">
                <div className="w-full">
                    <AudioPlayer
                        study={study}
                        onShare={handleShare}
                    />
                </div>

                <div className="flex flex-wrap justify-between items-center gap-4 py-4 border-y">
                   <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={study.authorPhotoURL || undefined} alt={study.authorName} />
                            <AvatarFallback>{authorInitial}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-base text-foreground">{study.authorName}</span>
                    </div>
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
