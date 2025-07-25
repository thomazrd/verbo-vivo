
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
        // 1. Fetch the 10 most recent published studies. This is a simple and fast query.
        const studiesQuery = query(
          collection(db, "studies"),
          where("status", "==", "PUBLISHED"),
          orderBy("publishedAt", "desc"),
          limit(10)
        );
        const snapshot = await getDocs(studiesQuery);
        const recentStudies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Study));

        // 2. Filter on the client-side. This is more flexible and avoids complex query errors.
        const filtered = recentStudies
          // Exclude the current study
          .filter(study => study.id !== currentStudyId)
          // Find studies with at least one matching tag, if tags are provided
          .filter(study => {
            if (!tags || tags.length === 0) {
              return true; // If no tags, all recent studies are "related"
            }
            return study.tags?.some(studyTag => tags.includes(studyTag)) ?? false;
          });
        
        // 3. Limit to the top 4 results.
        setRelatedStudies(filtered.slice(0, 4));

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
