
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { CompactStudyCard } from "./CompactStudyCard";

interface RelatedContentListProps {
  currentStudyId: string;
  tags?: string[];
}

export function RelatedContentList({ currentStudyId, tags }: RelatedContentListProps) {
  const [relatedStudies, setRelatedStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        let studiesQuery;
        if (tags && tags.length > 0) {
          studiesQuery = query(
            collection(db, "studies"),
            where("status", "==", "PUBLISHED"),
            where("tags", "array-contains-any", tags),
            orderBy("publishedAt", "desc"),
            limit(6) // Fetch a bit more to filter out the current one
          );
        } else {
          // Fallback: fetch most recent studies if no tags are available
          studiesQuery = query(
            collection(db, "studies"),
            where("status", "==", "PUBLISHED"),
            orderBy("publishedAt", "desc"),
            limit(5)
          );
        }

        const snapshot = await getDocs(studiesQuery);
        const fetchedStudies = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Study))
          .filter(study => study.id !== currentStudyId); // Exclude the current study

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
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-28 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
          ))}
        </div>
      );
  }
  
  if (relatedStudies.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum conteúdo similar encontrado.</p>;
  }

  return (
    <div className="space-y-4">
        {relatedStudies.map(study => (
            <CompactStudyCard key={study.id} study={study}/>
        ))}
    </div>
  );
}
