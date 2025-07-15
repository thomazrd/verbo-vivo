
"use client";

import type { BibleBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface ChapterGridProps {
  book: BibleBook;
  onChapterSelect: (chapter: number) => void;
  onBack: () => void;
  selectedChapter: number | null;
}

export function ChapterGrid({ book, onChapterSelect, onBack, selectedChapter }: ChapterGridProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-8 w-8 md:hidden" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Voltar para livros</span>
          </Button>
          <div>
            <CardTitle className="text-2xl">{book.name}</CardTitle>
            <CardDescription>Selecione um capítulo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-5 gap-2 pr-4">
            {chapters.map((chapter) => (
              <Button
                key={chapter}
                variant={selectedChapter === chapter ? "default" : "outline"}
                className="aspect-square h-auto w-full text-base"
                onClick={() => onChapterSelect(chapter)}
              >
                {chapter}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </>
  );
}
