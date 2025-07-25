
"use client";

import type { Study } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { BookCopy } from "lucide-react";

interface CompactStudyCardProps {
  study: Study;
}

const DEFAULT_THUMBNAIL = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

export function CompactStudyCard({ study }: CompactStudyCardProps) {
  const imageUrl = study.thumbnailUrl || DEFAULT_THUMBNAIL;
  
  return (
    <Link href={`/studies/${study.id}`} className="group flex gap-4 items-start">
        <div className="relative w-32 h-20 shrink-0 bg-muted rounded-lg overflow-hidden">
             <Image
                src={imageUrl}
                alt={study.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="128px"
                data-ai-hint="study lesson"
            />
        </div>
        <div className="flex-1">
            <h4 className="font-semibold text-sm leading-tight line-clamp-3 text-foreground group-hover:text-primary transition-colors">
                {study.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">{study.authorName}</p>
        </div>
    </Link>
  );
}
