
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
          where("__name__", "!=", currentStudyId),
          orderBy("__name__"), // Firestore requires an orderBy when using inequality filters
          limit(4)
        );

        const snapshot = await getDocs(relatedQuery);
        const fetchedStudies = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Study))
          .filter(study => study.id !== currentStudyId); // Double-check filtering

        setRelatedStudies(fetchedStudies);
      } catch (err) {
        console.error("Error fetching related studies:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRelated();
  }, [currentStudyId, tags]);

  if (isLoading || relatedStudies.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold tracking-tight mb-6">Conteúdos Relacionados</h2>
      <StudyList studies={relatedStudies} isLoading={false} />
    </div>
  );
}
