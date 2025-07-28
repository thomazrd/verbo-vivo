"use client";

import { StudyDetailClient } from '@/components/studies/StudyDetailClient';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Study } from '@/lib/types';
import { useEffect, useState } from 'react';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';

// This page is now a Client Component to avoid server-side Firebase Admin issues.
// It fetches the initial data and then passes it to the main client component.

export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.studyId as string;
  const { user, loading: authLoading } = useAuth();

  const [study, setStudy] = useState<Study | null | 'not-found'>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchStudy = async () => {
      try {
        const docRef = doc(db, 'studies', studyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.status === 'PUBLISHED') {
          setStudy({ id: docSnap.id, ...docSnap.data() } as Study);
        } else {
          // If the user is not authenticated, we should not immediately call notFound(),
          // as they might not have permission. For a client component, a simple
          // state change is better.
          setStudy('not-found');
        }
      } catch (error) {
        console.error("Error fetching study on client:", error);
        setStudy('not-found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudy();
  }, [studyId, authLoading, user]);


  if (isLoading || authLoading) {
    return <HomePageSkeleton />;
  }

  if (study === 'not-found') {
    notFound();
  }
  
  if (!study) {
    // This case handles the brief moment before the 'not-found' state is set
    return <HomePageSkeleton />;
  }

  return <StudyDetailClient initialStudy={study} />;
}
