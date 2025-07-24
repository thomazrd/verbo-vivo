
"use client";

import type { Study } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BookCopy } from "lucide-react";

interface StudyCardProps {
  study: Study;
}

export function StudyCard({ study }: StudyCardProps) {
  return (
    <Link href={`/studies/${study.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1">
        <div className="aspect-video overflow-hidden relative bg-muted">
          {study.thumbnailUrl ? (
             <Image
                src={study.thumbnailUrl}
                alt={study.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
             />
          ) : (
            <div className="flex items-center justify-center h-full">
                <BookCopy className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="text-lg font-semibold line-clamp-2">{study.title}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
