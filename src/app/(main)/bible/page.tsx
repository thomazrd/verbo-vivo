
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { BibleBook } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked } from 'lucide-react';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { BookSelector } from '@/components/bible/BookSelector';
import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { VersionSelector } from '@/components/bible/VersionSelector';
import { useWindowSize } from '@/hooks/use-window-size';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useFocusMode } from '@/contexts/focus-mode-context';

function BibleReaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  const bookAbbrevParam = searchParams.get('book');
  const chapterNumParam = searchParams.get('chapter');
  
  const [allBooks, setAllBooks] = useState<BibleBook[]>([]);
  const [selectedVersion, setSelectedVersion] = useState({id: 'nvi', name: 'NVI (pt)', language: 'pt', apiSource: 'abibliadigital' });
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loadingInitialState, setLoadingInitialState] = useState(true);
  
  const { width } = useWindowSize();
  const isDesktop = width >= 768;

  const updateUrlParams = (book: BibleBook | null, chapter: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (book) {
      params.set('book', book.abbrev.pt);
    } else {
      params.delete('book');
    }
    if (chapter) {
      params.set('chapter', chapter.toString());
    } else {
      params.delete('chapter');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch('/api/bible/books');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setAllBooks(data);
      } catch (err) {
        console.error("Erro ao buscar livros:", err);
      }
    };
    fetchBooks();
  }, []);
  
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
  
  useEffect(() => {
    const handleFullscreenChange = () => {
        if (!document.fullscreenElement && isFocusMode) {
          toggleFocusMode();
        }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFocusMode, toggleFocusMode]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      toggleFocusMode();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    updateUrlParams(book, null);
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
    updateUrlParams(selectedBook, chapter);
  };
  
  const handleBackToBooks = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    updateUrlParams(null, null);
  };

  const handleBackToChapters = () => {
    setSelectedChapter(null);
    updateUrlParams(selectedBook, null);
  }

  const handleNextChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter < selectedBook.chapters) {
      const nextChapter = selectedChapter + 1;
      setSelectedChapter(nextChapter);
      updateUrlParams(selectedBook, nextChapter);
    }
  };

  const handlePrevChapter = () => {
    if (selectedBook && selectedChapter && selectedChapter > 1) {
      const prevChapter = selectedChapter - 1;
      setSelectedChapter(prevChapter);
      updateUrlParams(selectedBook, prevChapter);
    }
  };
  
  const NavigationPanel = (
    <div className="flex flex-col h-full bg-background/95">
      <div className="p-4 border-b">
        <VersionSelector selectedVersion={selectedVersion} onVersionChange={setSelectedVersion} />
      </div>
      {!selectedBook ? (
        <BookSelector
          allBooks={allBooks}
          onBookSelect={handleBookSelect}
        />
      ) : (
        <ChapterGrid 
          book={selectedBook}
          onChapterSelect={handleChapterSelect}
          onBack={handleBackToBooks}
          selectedChapter={selectedChapter}
        />
      )}
    </div>
  );

  const MainContent = () => {
    if (selectedBook && selectedChapter) {
      return (
        <VerseDisplay 
          key={`${selectedBook.abbrev.pt}-${selectedChapter}`}
          version={selectedVersion}
          book={selectedBook} 
          chapter={selectedChapter} 
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
          onBackToChapters={handleBackToChapters}
          isDesktop={isDesktop}
          onToggleFullscreen={handleToggleFullscreen}
        />
      );
    }
    return (
      <div className="hidden md:flex h-full items-center justify-center p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <BookMarked className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Selecione um Livro e Capítulo</h2>
          <p className="text-muted-foreground max-w-sm">Use o painel de navegação para começar sua leitura.</p>
        </div>
      </div>
    );
  };

  if (loadingInitialState) {
    return (
      <div className="grid md:grid-cols-[350px_1fr] h-full">
        <div className="hidden md:block border-r p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-8">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      </div>
    );
  }
  
  if (isFocusMode && selectedChapter) {
     return (
        <main className="overflow-y-auto h-full w-full bg-background flex justify-center">
            <div className="w-full max-w-4xl">
                <MainContent />
            </div>
        </main>
     )
  }

  if (isDesktop) {
    return (
      <div className="grid h-full md:grid-cols-[350px_1fr]">
        <aside className="border-r">
          {NavigationPanel}
        </aside>
        <main className="overflow-y-auto">
          <MainContent />
        </main>
      </div>
    );
  }
  
  // Mobile Layout
  return (
    <div className="h-full">
      {selectedBook && selectedChapter ? (
        <MainContent />
      ) : selectedBook ? (
        <Card className="h-full border-none rounded-none">
          <CardContent className="p-0 h-full">
            <ChapterGrid
              book={selectedBook}
              selectedChapter={selectedChapter}
              onChapterSelect={handleChapterSelect}
              onBack={handleBackToBooks}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="p-0 h-full">
          <Sheet>
            <SheetTrigger asChild>
              <div className="p-4">
                <Button>
                  Selecionar Livro
                </Button>
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full max-w-sm">
                <BookSelector allBooks={allBooks} onBookSelect={handleBookSelect} />
            </SheetContent>
          </Sheet>

           <div className="h-full flex items-center justify-center p-12 text-center -mt-16">
                <div className="flex flex-col items-center gap-4">
                    <BookMarked className="h-16 w-16 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold">Leitura da Bíblia</h2>
                    <p className="text-muted-foreground max-w-sm">Use o botão acima para selecionar um livro e iniciar sua leitura.</p>
                </div>
            </div>
        </div>
      )}
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
