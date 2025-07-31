
"use client";

import { BookOpen } from "lucide-react";

interface VerseCardProps {
  reference: string;
  text: string;
  bibleVersion?: string;
}

export function VerseCard({ reference, text, bibleVersion }: VerseCardProps) {
  // Extract the abbreviation from the full version name, e.g., "NVI (pt)" -> "NVI"
  const versionAbbreviation = bibleVersion ? bibleVersion.split(' ')[0] : null;

  return (
    <div className="border bg-muted/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-4 w-4 text-primary" />
        <h4 className="font-semibold text-sm text-primary">{reference}</h4>
        {versionAbbreviation && <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{versionAbbreviation}</span>}
      </div>
      <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground text-sm leading-relaxed">
        “{text}”
      </blockquote>
    </div>
  );
}
