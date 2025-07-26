
"use client";

import type { Study } from "@/lib/types";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StudyCard } from "@/components/studies/StudyCard";
import { Skeleton } from "@/components/ui/skeleton";

interface StudiesShelfProps {
  title: string;
  studies: Study[];
  isLoading: boolean;
  viewAllLink?: string;
}

export function StudiesShelf({ title, studies, isLoading, viewAllLink = "/studies" }: StudiesShelfProps) {
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <div className="flex space-x-4 pb-4">
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
                <div className="w-64 space-y-2 shrink-0"><Skeleton className="w-full h-36" /><Skeleton className="h-4 w-5/6" /></div>
            </div>
        </div>
    );
  }

  if (studies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <Button variant="link" asChild>
          <Link href={viewAllLink}>Ver todos <ArrowRight className="ml-2 h-4 w-4"/></Link>
        </Button>
      </div>
      <div className="relative">
        <ScrollArea>
          <div className="flex space-x-4 pb-4">
            {studies.map((study) => (
              <StudyCard key={study.id} study={study} className="w-64 shrink-0" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
