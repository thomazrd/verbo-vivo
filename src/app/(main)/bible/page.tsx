
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
import { cn } from '@/lib/utils';
import { useWindowSize } from '@/hooks/use-window-size';
import { BookMarked } from 'lucide-react';

function BibleReaderContent() {
  const searchParams = useSearchParams();
  const bookAbbrevParam = searchParams.get('book');
  const chapterNumParam = searchParams.get('chapter');
  
  const [allBooks, setAllBooks] = useState<BibleBook[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>({id: 'nvi', name: 'NVI (pt)', language: 'pt', apiSource: 'abibliadigital' });
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loadingInitialState, setLoadingInitialState] = useState(true);

  const { width } = useWindowSize();
  const isMobile = width < 768; // md breakpoint

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
    if (allBooks.length > 0 && loadingInitialState) {
      const bookFromUrl = allBooks.find(b => b.abbrev.pt === bookAbbrevParam);
      if (bookFromUrl) {
        setSelectedBook(bookFromUrl);
        const chapter = parseInt(chapterNumParam || '', 10);
        if (!isNaN(chapter) && chapter > 0 && chapter <= bookFromUrl.chapters) {
          setSelectedChapter(chapter);
        }
      }
      setLoadingInitialState(false);
    }
  }, [allBooks, bookAbbrevParam, chapterNumParam, loadingInitialState]);

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
        <div className="container mx-auto max-w-7xl py-8 px-4">
            <div className="space-y-2 mb-8">
              <Skeleton className="h-9 w-1/3" />
              <Skeleton className="h-5 w-1/2" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-64 w-full" />
              </div>
              <div className="md:col-span-2">
                 <Skeleton className="h-96 w-full" />
              </div>
            </div>
        </div>
      );
  }

  // --- Display Logic ---
  const showBooksPanel = !isMobile || (!selectedBook && !selectedChapter);
  const showChaptersPanel = isMobile ? (selectedBook && !selectedChapter) : !!selectedBook;
  const showVersePanel = !!selectedChapter;

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 h-full">
      <div className="hidden md:block space-y-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leitura da Bíblia</h1>
        <p className="mt-1 text-muted-foreground">
          Navegue, leia e explore as Escrituras Sagradas.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 h-[calc(100%-120px)] relative overflow-hidden">
        
        {/* Painel de Livros */}
        <aside className={cn(
          "h-full flex-col gap-6",
          isMobile ? 'absolute inset-0 bg-background transition-transform duration-300' : 'flex',
          showBooksPanel ? 'translate-x-0' : '-translate-x-full',
        )}>
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

        {/* Painel de Capítulos */}
        <div className={cn(
          "md:col-span-1 h-full",
          isMobile ? 'absolute inset-0 bg-background transition-transform duration-300' : 'block',
          showChaptersPanel ? 'translate-x-0' : (isMobile ? 'translate-x-full' : 'hidden')
        )}>
          {selectedBook && (
            <ChapterGrid 
              book={selectedBook} 
              onChapterSelect={handleChapterSelect} 
              onBack={handleBackToBooks}
              selectedChapter={selectedChapter}
            />
          )}
        </div>

        {/* Painel de Versículos */}
        <main className={cn(
            "md:col-span-2 h-full overflow-y-auto",
            isMobile ? 'absolute inset-0 bg-background transition-transform duration-300' : 'block',
            showVersePanel ? 'translate-x-0' : (isMobile ? 'translate-x-full' : 'hidden')
        )}>
          {selectedChapter && selectedBook ? (
            <VerseDisplay 
              version={selectedVersion}
              book={selectedBook} 
              chapter={selectedChapter} 
              onBack={handleBackToChapters}
              onNextChapter={handleNextChapter}
              onPrevChapter={handlePrevChapter}
            />
          ) : !isMobile && (
            <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <BookMarked className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Selecione um livro e capítulo para começar.</p>
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function BibleReaderPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center">Carregando...</div>}>
      <BibleReaderContent />
    </Suspense>
  )
}
