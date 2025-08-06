
"use client";

import type { Study } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlayCircle, Eye, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudyCardProps {
  study: Study;
  className?: string;
}

const DEFAULT_THUMBNAIL = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";

export function StudyCard({ study, className }: StudyCardProps) {
  const imageUrl = study.thumbnailUrl || DEFAULT_THUMBNAIL;
  const timeAgo = study.publishedAt
    ? formatDistanceToNow(study.publishedAt.toDate(), { addSuffix: true, locale: ptBR })
    : "Recentemente";

  return (
    <Link href={`/studies/${study.id}`} className={cn("group block h-full", className)}>
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg">
        <div className="aspect-video overflow-hidden relative bg-muted">
          <Image
            src={imageUrl}
            alt={`Capa do estudo: ${study.title}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="study lesson"
          />
           <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-300">
                <PlayCircle className="h-12 w-12 text-white/80 opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
        <CardHeader className="flex-grow">
          <CardTitle className="text-base font-semibold line-clamp-2">{study.title}</CardTitle>
          <div className="flex items-center gap-1.5 pt-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-primary">Verbo Vivo</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
             <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{study.viewCount || 0}</span>
                </div>
                <span>{timeAgo}</span>
             </div>
        </CardContent>
      </Card>
    </Link>
  );
}
