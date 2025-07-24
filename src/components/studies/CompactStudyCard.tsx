
"use client";

import type { Study } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { BookCopy } from "lucide-react";

interface CompactStudyCardProps {
  study: Study;
}

export function CompactStudyCard({ study }: CompactStudyCardProps) {
  return (
    <Link href={`/studies/${study.id}`} className="group flex gap-4 items-start">
        <div className="relative w-28 h-20 shrink-0 bg-muted rounded-lg overflow-hidden">
             {study.thumbnailUrl ? (
                <Image
                    src={study.thumbnailUrl}
                    alt={study.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="112px"
                />
             ) : (
                <div className="flex items-center justify-center h-full">
                    <BookCopy className="h-8 w-8 text-muted-foreground" />
                </div>
             )}
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {study.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{study.authorName}</p>
        </div>
    </Link>
  );
}
