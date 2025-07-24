
"use client";

import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { StudyCard } from "./StudyCard";

interface StudyListProps {
  studies: Study[];
  isLoading: boolean;
}

export function StudyList({ studies, isLoading }: StudyListProps) {
  if (isLoading) {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {studies.map((study) => (
        <StudyCard key={study.id} study={study} />
      ))}
    </div>
  );
}
