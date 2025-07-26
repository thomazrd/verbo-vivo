
"use client";

import { useState, useEffect } from "react";
import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { CompactStudyCard } from "./CompactStudyCard";
import type { User } from "firebase/auth";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RelatedContentListProps {
  user: User | null; // Keep user prop for potential future personalization
  currentStudyId: string;
  tags?: string[];
}

export function RelatedContentList({ user, currentStudyId, tags }: RelatedContentListProps) {
  const [relatedStudies, setRelatedStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterStudies = async () => {
      setIsLoading(true);
      try {
        // This query now includes `where("status", "==", "PUBLISHED")` to comply with security rules for unauthenticated access.
        const studiesQuery = query(
          collection(db, "studies"),
          where("status", "==", "PUBLISHED"),
          orderBy("publishedAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(studiesQuery);
        const recentStudies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Study));

        // Client-side filtering remains for flexibility with tags and excluding the current study.
        const filtered = recentStudies
          .filter(study => study.id !== currentStudyId)
          .filter(study => {
            if (!tags || tags.length === 0) {
              return true; 
            }
            return study.tags?.some(studyTag => tags.includes(studyTag)) ?? false;
          });
        
        // If filtering by tag results in few studies, supplement with recent ones
        const finalStudies = [...filtered];
        if (finalStudies.length < 4) {
          const recentFiltered = recentStudies.filter(s => s.id !== currentStudyId && !finalStudies.find(fs => fs.id === s.id));
          finalStudies.push(...recentFiltered.slice(0, 4 - finalStudies.length));
        }

        setRelatedStudies(finalStudies.slice(0, 4));

      } catch (err) {
        console.error("Error fetching related studies:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAndFilterStudies();
  }, [currentStudyId, tags]);

  if (isLoading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-32 shrink-0 rounded-lg" />
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
    return null;
  }

  return (
    <div className="space-y-4">
        {relatedStudies.map(study => (
            <CompactStudyCard key={study.id} study={study}/>
        ))}
    </div>
  );
}
