
"use client";

import type { BibleBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ChapterGridProps {
  book: BibleBook;
  onChapterSelect: (chapter: number) => void;
  onBack: () => void;
  selectedChapter: number | null;
}

export function ChapterGrid({ book, onChapterSelect, onBack, selectedChapter }: ChapterGridProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 border-b p-4">
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Voltar para livros</span>
          </Button>
          <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{book.name}</h2>
              <p className="text-sm text-muted-foreground">Selecione um capítulo</p>
          </div>
      </div>
      <ScrollArea className="flex-1">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 p-4">
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
    </div>
  );
}
