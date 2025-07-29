
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type { BibleBook } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked, Menu } from 'lucide-react';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import BookSelector from '@/components/bible/BookSelector';
import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { VersionSelector } from '@/components/bible/VersionSelector';
import { useWindowSize } from '@/hooks/use-window-size';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
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

  const updateUrlParams = useCallback((book: BibleBook | null, chapter: number | null) => {
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
  }, [searchParams, router, pathname]);

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
  
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
    toggleFocusMode();
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Exit focus mode if user presses Esc to exit fullscreen
      if (!document.fullscreenElement && isFocusMode) {
        toggleFocusMode();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFocusMode, toggleFocusMode]);


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

  const handleBackToChapters = useCallback(() => {
    if (isFocusMode) {
      toggleFocusMode();
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    }
    setSelectedChapter(null);
    updateUrlParams(selectedBook, null);
  }, [selectedBook, updateUrlParams, isFocusMode, toggleFocusMode]);

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

  const MobileInitialView = (
      <div className="h-full flex flex-col justify-center items-center p-8 text-center bg-background">
          <Sheet>
              <SheetTrigger asChild>
                  <Button variant="outline" className="mb-8">
                      <Menu className="mr-2 h-4 w-4" />
                      Selecionar Livro
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-full max-w-sm">
                 <div className="p-4 border-b">
                    <VersionSelector selectedVersion={selectedVersion} onVersionChange={setSelectedVersion} />
                  </div>
                  <BookSelector allBooks={allBooks} onBookSelect={(book) => {
                      // Use a SheetClose inside BookSelector or handle close manually if needed
                      handleBookSelect(book);
                  }} />
              </SheetContent>
          </Sheet>
          <BookMarked className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mt-4">Leitura da Bíblia</h2>
          <p className="text-muted-foreground max-w-sm">Use o menu para selecionar um livro e capítulo para começar.</p>
      </div>
  );
  
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
  
  const mainContent = selectedBook && selectedChapter && (
     <VerseDisplay 
        key={`${selectedVersion.id}-${selectedBook.abbrev.pt}-${selectedChapter}`}
        version={selectedVersion}
        book={selectedBook} 
        chapter={selectedChapter} 
        onNextChapter={handleNextChapter}
        onPrevChapter={handlePrevChapter}
        onBackToChapters={handleBackToChapters}
        onToggleFullscreen={handleToggleFullscreen}
      />
  );
  
  if (isFocusMode) {
     return (
        <main className="overflow-y-auto h-full w-full bg-background flex justify-center">
            <div className="w-full max-w-4xl">
                {mainContent}
            </div>
        </main>
     )
  }

  // --- Desktop Layout ---
  if (isDesktop) {
    return (
      <div className="grid h-full md:grid-cols-[350px_1fr]">
        <aside className="border-r flex flex-col">
            <div className="p-4 border-b">
                <VersionSelector selectedVersion={selectedVersion} onVersionChange={setSelectedVersion} />
            </div>
            {!selectedBook ? (
                 <BookSelector allBooks={allBooks} onBookSelect={handleBookSelect} />
            ) : (
                 <ChapterGrid book={selectedBook} onChapterSelect={handleChapterSelect} onBack={handleBackToBooks} selectedChapter={selectedChapter} />
            )}
        </aside>
        <main className="overflow-y-auto">
          {mainContent || (
            <div className="flex h-full items-center justify-center p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                <BookMarked className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Selecione um Livro e Capítulo</h2>
                <p className="text-muted-foreground max-w-sm">Use o painel de navegação para começar sua leitura.</p>
                </div>
            </div>
          )}
        </main>
      </div>
    );
  }
  
  // --- Mobile Layout ---
  return (
    <div className="h-full bg-background">
      {mainContent ? mainContent : 
       selectedBook ? <ChapterGrid book={selectedBook} onChapterSelect={handleChapterSelect} onBack={handleBackToBooks} selectedChapter={selectedChapter} /> :
       MobileInitialView
      }
    </div>
  );
}

export default function BibleReaderPage() {
  return <BibleReaderContent />;
}
