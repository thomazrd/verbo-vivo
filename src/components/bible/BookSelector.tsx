
"use client";

import { useState } from 'react';
import type { BibleBook } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookSelectorProps {
  allBooks: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
  selectedBookAbbrev?: string;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BookSelector({ allBooks, onBookSelect, selectedBookAbbrev }: BookSelectorProps) {
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
    <div className="flex flex-col gap-2 h-full">
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
      <ScrollArea className="flex-1 rounded-md border">
        <div className="p-2">
            {filteredBooks.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</p>
            )}
            {oldTestamentBooks.length > 0 && (
                <>
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mt-2">Antigo Testamento</p>
                    {oldTestamentBooks.map((book) => (
                        <Button
                            key={book.abbrev.pt}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-left",
                                selectedBookAbbrev === book.abbrev.pt && "bg-muted font-bold text-primary"
                            )}
                            onClick={() => onBookSelect(book)}
                        >
                            {book.name}
                        </Button>
                    ))}
                </>
            )}
            {newTestamentBooks.length > 0 && (
                 <>
                    <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mt-4">Novo Testamento</p>
                    {newTestamentBooks.map((book) => (
                         <Button
                            key={book.abbrev.pt}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-left",
                                selectedBookAbbrev === book.abbrev.pt && "bg-muted font-bold text-primary"
                            )}
                            onClick={() => onBookSelect(book)}
                        >
                            {book.name}
                        </Button>
                    ))}
                </>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
