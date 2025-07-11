
"use client";

import { useState, useEffect, Suspense } from 'react';
import { BookSelector } from '@/components/bible/BookSelector';
import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { VersionSelector } from '@/components/bible/VersionSelector';
import type { BibleBook, BibleVersion } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

function BibleReaderContent() {
  const searchParams = useSearchParams();
  const bookAbbrev = searchParams.get('book');
  const chapterNum = searchParams.get('chapter');
  
  const [allBooks, setAllBooks] = useState<BibleBook[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>({id: 'nvi', name: 'NVI (pt)', language: 'pt', apiSource: 'abibliadigital' });
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loadingInitialState, setLoadingInitialState] = useState(true);

  // Fetch all books once on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get<BibleBook[]>('/api/bible/books');
        setAllBooks(response.data);
      } catch (err) {
        console.error("Erro ao buscar livros:", err);
      }
    };
    fetchBooks();
  }, []);
  
  // Set initial state from URL params once books are loaded
  useEffect(() => {
    if (allBooks.length > 0) {
      const bookFromUrl = allBooks.find(b => b.abbrev.pt === bookAbbrev);
      if (bookFromUrl) {
        setSelectedBook(bookFromUrl);
        const chapter = parseInt(chapterNum || '', 10);
        if (!isNaN(chapter) && chapter > 0 && chapter <= bookFromUrl.chapters) {
          setSelectedChapter(chapter);
        }
      }
      setLoadingInitialState(false);
    }
  }, [allBooks, bookAbbrev, chapterNum]);

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

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter < selectedBook.chapters) {
      setSelectedChapter(selectedChapter + 1);
    }
  };

  const handlePrevChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    }
  };

  if (loadingInitialState) {
      return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-5 w-1/2 mb-8" />
            <div className="flex flex-col md:flex-row gap-8">
              <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-64 w-full" />
              </aside>
               <main className="flex-1">
                 <Skeleton className="h-96 w-full" />
              </main>
            </div>
        </div>
      );
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
            allBooks={allBooks}
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
              onNextChapter={handleNextChapter}
              onPrevChapter={handlePrevChapter}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function BibleReaderPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <BibleReaderContent />
    </Suspense>
  )
}
