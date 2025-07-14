
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { cn } from '@/lib/utils';
import type { BibleBook, BibleVersion } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { BookMarked } from 'lucide-react';
import { BibleNavigation } from '@/components/bible/BibleNavigation';
import { VerseDisplay } from '@/components/bible/VerseDisplay';

function BibleReaderContent() {
  const searchParams = useSearchParams();
  const bookAbbrevParam = searchParams.get('book');
  const chapterNumParam = searchParams.get('chapter');
  
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

  const handleChapterSelect = (book: BibleBook, chapter: number) => {
    setSelectedBook(book);
    setSelectedChapter(chapter);
  };

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
      {/* Painel de Navegação (Esquerda) */}
      <aside className="hidden md:flex flex-col border-r bg-background/95">
        <BibleNavigation
          allBooks={allBooks}
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          onChapterSelect={handleChapterSelect}
          selectedVersion={selectedVersion}
          onVersionChange={setSelectedVersion}
        />
      </aside>

      {/* Painel de Conteúdo (Direita) */}
      <main className="overflow-y-auto">
        {selectedBook && selectedChapter ? (
          <VerseDisplay 
            key={`${selectedBook.abbrev.pt}-${selectedChapter}`}
            version={selectedVersion}
            book={selectedBook} 
            chapter={selectedChapter} 
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-12 text-center">
             <div className="flex flex-col items-center gap-4">
                <BookMarked className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Selecione um Livro e Capítulo</h2>
                <p className="text-muted-foreground max-w-sm">Use o painel de navegação à esquerda para começar sua leitura nas Escrituras Sagradas.</p>
              </div>
          </div>
        )}
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
