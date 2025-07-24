
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
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useContentAccess } from "@/hooks/use-content-access";
import { AccessModal } from "@/components/auth/AccessModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

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

  if (study === 'not-found') {
    notFound();
  }
  
  if (study === null || authLoading || isAccessLoading) {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                <div className="md:col-span-2 lg:col-span-3 space-y-6">
                    <Skeleton className="w-full aspect-video rounded-lg" />
                    <Skeleton className="h-10 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-20 w-full rounded-lg" />
                </div>
                <div className="md:col-span-1 lg:col-span-1 space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            
            {/* Main Content Column */}
            <div className="md:col-span-2 lg:col-span-3 space-y-8">
                <AudioPlayer
                    audioUrl={study.audioUrl}
                    coverImageUrl={study.thumbnailUrl}
                    title={study.title}
                />
                <header>
                    {study.tags && study.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {study.tags.map(tag => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    )}
                    <h1 className="text-3xl font-bold tracking-tight">{study.title}</h1>
                    <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={study.authorPhotoURL || undefined} alt={study.authorName} />
                            <AvatarFallback>{authorInitial}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{study.authorName}</span>
                    </div>
                </header>

                <StudyContentAccordion 
                    markdownContent={study.content}
                    practicalChallenge={study.practicalChallenge}
                />
            </div>

            {/* Related Content Sidebar */}
            <div className="md:col-span-1 lg:col-span-1 space-y-6">
                 <h2 className="text-xl font-bold tracking-tight">Relacionados</h2>
                 <RelatedContentList currentStudyId={study.id} tags={study.tags} />
            </div>

        </div>
      </div>
      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </>
  );
}
