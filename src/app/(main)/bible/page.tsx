"use client";

import { useState } from 'react';
import { BookSelector } from '@/components/bible/BookSelector';
import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { VersionSelector } from '@/components/bible/VersionSelector';
import type { BibleBook } from '@/lib/types';

export default function BibleReaderPage() {
  const [selectedVersion, setSelectedVersion] = useState<string>('nvi');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(null); // Reseta o capítulo ao selecionar um novo livro
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
  };
  
  const handleBackToBooks = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
  }
  
  const handleBackToChapters = () => {
      setSelectedChapter(null);
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leitura da Bíblia</h1>
        <p className="mt-1 text-muted-foreground">
          Navegue e leia as Escrituras Sagradas.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
           <VersionSelector 
            selectedVersion={selectedVersion} 
            onVersionChange={setSelectedVersion} 
          />
          <BookSelector 
            selectedBookAbbrev={selectedBook?.abbrev.pt}
            onBookSelect={handleBookSelect} 
          />
        </aside>

        <main className="flex-1">
          {!selectedBook ? (
            <div className="flex items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
              <p className="text-muted-foreground">Selecione um livro para começar a ler.</p>
            </div>
          ) : !selectedChapter ? (
            <ChapterGrid 
              book={selectedBook} 
              onChapterSelect={handleChapterSelect} 
              onBack={handleBackToBooks}
            />
          ) : (
            <VerseDisplay 
              version={selectedVersion}
              book={selectedBook} 
              chapter={selectedChapter} 
              onBack={handleBackToChapters}
            />
          )}
        </main>
      </div>
    </div>
  );
}
