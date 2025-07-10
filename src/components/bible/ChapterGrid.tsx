"use client";

import type { BibleBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface ChapterGridProps {
  book: BibleBook;
  onChapterSelect: (chapter: number) => void;
  onBack: () => void;
}

export function ChapterGrid({ book, onChapterSelect, onBack }: ChapterGridProps) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar</span>
                </Button>
                <div>
                    <CardTitle className="text-2xl">{book.name}</CardTitle>
                    <CardDescription>Selecione um capítulo</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {chapters.map((chapter) => (
                <Button
                key={chapter}
                variant="outline"
                className="aspect-square h-auto w-full text-base"
                onClick={() => onChapterSelect(chapter)}
                >
                {chapter}
                </Button>
            ))}
            </div>
        </CardContent>
    </Card>
  );
}