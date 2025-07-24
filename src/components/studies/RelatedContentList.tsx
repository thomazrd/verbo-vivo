
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import type { Study } from "@/lib/types";
import { StudyList } from "./StudyList";

interface RelatedContentListProps {
  currentStudyId: string;
  tags?: string[];
}

export function RelatedContentList({ currentStudyId, tags }: RelatedContentListProps) {
  const [relatedStudies, setRelatedStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!tags || tags.length === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        const relatedQuery = query(
          collection(db, "studies"),
          where("status", "==", "PUBLISHED"),
          where("tags", "array-contains-any", tags),
          orderBy("publishedAt", "desc"),
          limit(5)
        );

        const snapshot = await getDocs(relatedQuery);
        const fetchedStudies = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Study))
          .filter(study => study.id !== currentStudyId); // Double-check filtering

        setRelatedStudies(fetchedStudies.slice(0, 4)); // Ensure max 4 are shown
      } catch (err) {
        console.error("Error fetching related studies:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRelated();
  }, [currentStudyId, tags]);

  if (isLoading) {
      return <StudyList studies={[]} isLoading={true} layout="compact" />
  }
  
  if (relatedStudies.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo similar encontrado.</p>;
  }

  return (
    <StudyList studies={relatedStudies} isLoading={false} layout="compact"/>
  );
}
