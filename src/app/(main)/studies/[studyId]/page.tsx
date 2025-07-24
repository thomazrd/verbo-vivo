
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
  
  // Use a flag to prevent running the hook on server or before auth is resolved.
  const shouldCheckAccess = !authLoading && !user;
  const { canView, isLoading: isAccessLoading } = useContentAccess(studyId, shouldCheckAccess);
  
  useEffect(() => {
    if (authLoading || isAccessLoading) return;

    if (!canView) {
      setIsAccessModalOpen(true);
      // We still fetch the study to show metadata if needed, but gate the content
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
        <div className="w-full max-w-4xl mx-auto px-4 py-8 space-y-6">
            <Skeleton className="w-full aspect-video rounded-lg" />
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
        </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <AudioPlayer
          audioUrl={study.audioUrl}
          coverImageUrl={study.thumbnailUrl}
          title={study.title}
        />
        <main className="p-4 sm:p-6 md:p-8 space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">{study.title}</h1>
                 {study.tags && study.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                        {study.tags.map(tag => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                )}
            </header>

            <StudyContentAccordion 
                markdownContent={study.content}
                practicalChallenge={study.practicalChallenge}
            />

            <RelatedContentList currentStudyId={study.id} tags={study.tags} />
        </main>
      </div>
      <AccessModal 
        isOpen={isAccessModalOpen} 
        onClose={() => setIsAccessModalOpen(false)} 
      />
    </>
  );
}
