
"use client";

import { useState } from 'react';
import type { BibleBook } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface BookSelectorProps {
  allBooks: BibleBook[];
  selectedBook: BibleBook | null;
  selectedChapter: number | null;
  onChapterSelect: (book: BibleBook, chapter: number) => void;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BookSelector({ allBooks, selectedBook, selectedChapter, onChapterSelect }: BookSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredBooks = allBooks.filter(book => 
    normalizeString(book.name).includes(normalizeString(searchTerm))
  );

  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'VT');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'NT');

  if (allBooks.length === 0) {
     return <p className="text-destructive text-sm">Não foi possível carregar os livros.</p>;
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="relative px-4">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Pesquisar livro..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="single" collapsible className="w-full px-4" value={selectedBook?.abbrev.pt}>
            {oldTestamentBooks.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Antigo Testamento</p>
                    {oldTestamentBooks.map(book => (
                        <AccordionItem value={book.abbrev.pt} key={book.abbrev.pt}>
                            <AccordionTrigger>{book.name}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                        <Button
                                            key={chapter}
                                            variant={selectedBook?.abbrev.pt === book.abbrev.pt && selectedChapter === chapter ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-8"
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
                <div>
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Novo Testamento</p>
                    {newTestamentBooks.map(book => (
                        <AccordionItem value={book.abbrev.pt} key={book.abbrev.pt}>
                            <AccordionTrigger>{book.name}</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                        <Button
                                            key={chapter}
                                            variant={selectedBook?.abbrev.pt === book.abbrev.pt && selectedChapter === chapter ? 'default' : 'outline'}
                                            size="sm"
                                            className="h-8"
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
    </div>
  );
}
