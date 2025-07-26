
"use client";

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Study } from '@/lib/types';
import { StudyDetailClient } from '@/components/studies/StudyDetailClient';
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton';


export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.studyId as string;
  const [study, setStudy] = useState<Study | null | undefined>(undefined);
  
  useEffect(() => {
    if (!studyId) return;

    const fetchStudy = async () => {
        const docRef = doc(db, 'studies', studyId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.status === 'PUBLISHED') {
            setStudy({ id: docSnap.id, ...docSnap.data() } as Study);
        } else {
            setStudy(null); // Mark as not found
        }
    }
    fetchStudy();
  }, [studyId]);


  if (study === undefined) {
    // Loading state
    return <HomePageSkeleton />;
  }

  if (study === null) {
    // Not found state
    notFound();
  }

  return <StudyDetailClient study={study} />;
}
