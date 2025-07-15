
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import type { BibleBook, BibleVersion } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked, Menu } from 'lucide-react';
import { VerseDisplay } from '@/components/bible/VerseDisplay';
import { BookSelector } from '@/components/bible/BookSelector';
import { ChapterGrid } from '@/components/bible/ChapterGrid';
import { VersionSelector } from '@/components/bible/VersionSelector';
import { useWindowSize } from '@/hooks/use-window-size';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function BibleReaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const bookAbbrevParam = searchParams.get('book');
  const chapterNumParam = searchParams.get('chapter');
  
  const [allBooks, setAllBooks] = useState<BibleBook[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<BibleVersion>({id: 'nvi', name: 'NVI (pt)', language: 'pt', apiSource: 'abibliadigital' });
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [loadingInitialState, setLoadingInitialState] = useState(true);
  
  const { width } = useWindowSize();
  const isDesktop = width >= 768; // md breakpoint

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
        const response = await axios.get<BibleBook[]>('/api/bible/books');
        setAllBooks(response.data);
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
          selectedChapter={selectedChapter}
          onChapterSelect={handleChapterSelect}
          onBack={handleBackToBooks}
          isDesktop={isDesktop}
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
        />
      );
    }
    // On desktop, show placeholder. On mobile, this area will be hidden by navigation.
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

  if (isDesktop) {
    return (
      <div className="grid md:grid-cols-[350px_1fr] h-full">
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
      {!selectedBook && !selectedChapter && (
        <div className="p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Menu className="mr-2 h-4 w-4"/>
                Selecionar Livro
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              {NavigationPanel}
            </SheetContent>
          </Sheet>
        </div>
      )}
      {selectedBook && !selectedChapter && (
         <Card className="h-full border-none rounded-none">
            <CardContent className="p-0 h-full">
              <ChapterGrid
                book={selectedBook}
                selectedChapter={selectedChapter}
                onChapterSelect={handleChapterSelect}
                onBack={handleBackToBooks}
                isDesktop={isDesktop}
              />
            </CardContent>
          </Card>
      )}
      {selectedChapter && <MainContent />}
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
