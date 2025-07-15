
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
        handleBookSelect(bookFromUrl);
        const chapter = parseInt(chapterNumParam || '', 10);
        if (!isNaN(chapter) && chapter > 0 && chapter <= bookFromUrl.chapters) {
          handleChapterSelect(chapter);
        }
      }
      setLoadingInitialState(false);
    }
  }, [allBooks, bookAbbrevParam, chapterNumParam, loadingInitialState]);
  
  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setSelectedChapter(null); // Reset chapter when a new book is selected
  };

  const handleChapterSelect = (chapter: number) => {
    setSelectedChapter(chapter);
  };
  
  const handleBackToBooks = () => {
      setSelectedBook(null);
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
  
  const DesktopNavigation = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <VersionSelector selectedVersion={selectedVersion} onVersionChange={setSelectedVersion} />
      </div>
      <BookSelector
        allBooks={allBooks}
        selectedBook={selectedBook}
        onBookSelect={handleBookSelect}
      />
    </div>
  );

  const MobileNavigation = (
      <div className="flex flex-col h-full bg-background/95">
        <div className="p-4 border-b">
          <VersionSelector selectedVersion={selectedVersion} onVersionChange={setSelectedVersion} />
        </div>
        {!selectedBook ? (
            <BookSelector
                allBooks={allBooks}
                selectedBook={selectedBook}
                onBookSelect={handleBookSelect}
            />
        ) : (
            <ChapterGrid 
                book={selectedBook}
                selectedChapter={selectedChapter}
                onChapterSelect={handleChapterSelect}
                onBack={handleBackToBooks}
            />
        )}
      </div>
  );

  const renderContent = () => {
      // VerseDisplay has priority if a chapter is selected
      if (selectedBook && selectedChapter) {
        return (
            <VerseDisplay 
                key={`${selectedBook.abbrev.pt}-${selectedChapter}`}
                version={selectedVersion}
                book={selectedBook} 
                chapter={chapterNumParam ? parseInt(chapterNumParam) : selectedChapter} 
                onNextChapter={handleNextChapter}
                onPrevChapter={handlePrevChapter}
            />
        );
      }
      
      // On mobile, show the navigation flow (books or chapters)
      if (isMobile) {
          return MobileNavigation;
      }

      // On desktop, show the placeholder if no chapter is selected
      return (
        <div className="flex h-full items-center justify-center p-12 text-center">
            <div className="flex flex-col items-center gap-4">
                <BookMarked className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Selecione um Livro e Capítulo</h2>
                <p className="text-muted-foreground max-w-sm">Use o painel de navegação para começar sua leitura nas Escrituras Sagradas.</p>
            </div>
        </div>
      );
  }


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

  return (
    <div className="grid md:grid-cols-[350px_1fr] h-full">
      {/* --- Navegação --- */}
      <aside className="hidden md:flex flex-col border-r bg-background/95">
        {DesktopNavigation}
      </aside>

      {/* --- Conteúdo --- */}
      <main className="overflow-y-auto">
        {renderContent()}
      </main>
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
