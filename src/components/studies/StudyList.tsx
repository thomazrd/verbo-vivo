
"use client";

import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { StudyCard } from "./StudyCard";
import { CompactStudyCard } from "./CompactStudyCard";
import { cn } from "@/lib/utils";

interface StudyListProps {
  studies: Study[];
  isLoading: boolean;
  layout?: 'grid' | 'compact';
}

export function StudyList({ studies, isLoading, layout = 'grid' }: StudyListProps) {
  const cardComponent = layout === 'compact' ? CompactStudyCard : StudyCard;

  if (isLoading) {
    if (layout === 'compact') {
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
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border bg-card rounded-lg overflow-hidden">
            <Skeleton className="w-full aspect-video" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const ListContainer = layout === 'compact' ? 'div' : 'div';
  const containerClass = layout === 'compact' 
    ? 'space-y-4' 
    : 'grid grid-cols-1 md:grid-cols-2 gap-6';

  return (
    <ListContainer className={containerClass}>
      {studies.map((study) => 
        layout === 'compact' 
          ? <CompactStudyCard key={study.id} study={study} />
          : <StudyCard key={study.id} study={study} />
      )}
    </ListContainer>
  );
}
