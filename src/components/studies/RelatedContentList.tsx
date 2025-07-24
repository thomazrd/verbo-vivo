
"use client";

import { useState, useEffect } from "react";
import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { CompactStudyCard } from "./CompactStudyCard";
import type { User } from "firebase/auth";
import axios from "axios";

interface RelatedContentListProps {
  user: User | null;
  currentStudyId: string;
  tags?: string[];
}

export function RelatedContentList({ user, currentStudyId, tags }: RelatedContentListProps) {
  const [relatedStudies, setRelatedStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchRelated = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          currentStudyId,
        });
        if (tags && tags.length > 0) {
          params.append('tags', tags.join(','));
        }
        
        const response = await axios.get(`/api/studies/related?${params.toString()}`);
        setRelatedStudies(response.data);

      } catch (err) {
        console.error("Error fetching related studies:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRelated();
  }, [currentStudyId, tags, user]);

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
