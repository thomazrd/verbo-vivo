
"use client";

import { useState } from 'react';
import type { BibleBook, BibleVersion } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VersionSelector } from './VersionSelector';
import { Skeleton } from '../ui/skeleton';

interface BibleNavigationProps {
  allBooks: BibleBook[];
  selectedBook: BibleBook | null;
  selectedChapter: number | null;
  onChapterSelect: (book: BibleBook, chapter: number) => void;
  selectedVersion: BibleVersion;
  onVersionChange: (version: BibleVersion) => void;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BibleNavigation({
  allBooks,
  selectedBook,
  selectedChapter,
  onChapterSelect,
  selectedVersion,
  onVersionChange
}: BibleNavigationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBooks = allBooks.filter(book => 
    normalizeString(book.name).includes(normalizeString(searchTerm))
  );

  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'VT');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'NT');

  if (allBooks.length === 0) {
     return (
        <div className="p-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
     )
  }

  // Determine the default open accordion item
  const defaultAccordionValue = selectedBook ? `book-${selectedBook.abbrev.pt}` : (
      (searchTerm && filteredBooks.length > 0) ? `book-${filteredBooks[0].abbrev.pt}` : undefined
  );
  
  return (
    <>
      <div className="p-4 space-y-4 border-b">
        <VersionSelector selectedVersion={selectedVersion} onVersionChange={onVersionChange} />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Pesquisar livro..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible className="w-full" value={defaultAccordionValue}>
            {filteredBooks.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</p>
            )}
            {oldTestamentBooks.length > 0 && (
                <div className="p-2">
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mb-1">Antigo Testamento</p>
                    {oldTestamentBooks.map(book => (
                        <AccordionItem value={`book-${book.abbrev.pt}`} key={book.abbrev.pt}>
                            <AccordionTrigger className="px-2 py-2 text-base rounded-md hover:bg-muted/50">
                                {book.name}
                            </AccordionTrigger>
                            <AccordionContent className="p-2">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                        <Button
                                            key={chapter}
                                            variant={selectedBook?.abbrev.pt === book.abbrev.pt && selectedChapter === chapter ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-9"
                                            onClick={() => onChapterSelect(book, chapter)}
                                        >
                                            {chapter}
                                        </Button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </div>
            )}
             {newTestamentBooks.length > 0 && (
                <div className="p-2">
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mb-1">Novo Testamento</p>
                    {newTestamentBooks.map(book => (
                        <AccordionItem value={`book-${book.abbrev.pt}`} key={book.abbrev.pt}>
                            <AccordionTrigger className="px-2 py-2 text-base rounded-md hover:bg-muted/50">
                                {book.name}
                            </AccordionTrigger>
                            <AccordionContent className="p-2">
                                <div className="grid grid-cols-5 gap-1.5">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                        <Button
                                            key={chapter}
                                            variant={selectedBook?.abbrev.pt === book.abbrev.pt && selectedChapter === chapter ? 'default' : 'ghost'}
                                            size="sm"
                                            className="h-9"
                                            onClick={() => onChapterSelect(book, chapter)}
                                        >
                                            {chapter}
                                        </Button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </div>
            )}
        </Accordion>
      </ScrollArea>
    </>
  );
}
