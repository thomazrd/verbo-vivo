
"use client";

import type { Study } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import { StudyCard } from "./StudyCard";

interface StudiesGridProps {
  studies: Study[];
}

export function StudiesGrid({ studies }: StudiesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {studies.map((study) => 
          <StudyCard key={study.id} study={study} />
      )}
    </div>
  );
}
