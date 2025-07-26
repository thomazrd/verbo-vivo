
"use client";

import { BookOpen } from "lucide-react";

interface VerseCardProps {
  reference: string;
  text: string;
}

export function VerseCard({ reference, text }: VerseCardProps) {
  return (
    <div className="border bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm text-primary">{reference}</h4>
      </div>
      <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground text-sm leading-relaxed">
        “{text}”
      </blockquote>
    </div>
  );
}
