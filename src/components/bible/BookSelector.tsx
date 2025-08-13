
"use client";

import { useState } from 'react';
import type { BibleBook } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface BookSelectorProps {
  allBooks: BibleBook[];
  onBookSelect: (book: BibleBook) => void;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function BookSelector({ allBooks, onBookSelect }: BookSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (allBooks.length === 0) {
     return <p className="text-destructive text-sm p-4 text-center">Não foi possível carregar os livros da Bíblia. Verifique a configuração da API.</p>;
  }

  const filteredBooks = allBooks.filter(book => 
    normalizeString(book.name).includes(normalizeString(searchTerm))
  );

  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'VT');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'NT');

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
      <ScrollArea className="flex-1 px-4">
          {filteredBooks.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">Nenhum livro encontrado.</p>
          )}
          {oldTestamentBooks.length > 0 && (
              <div className="mb-4">
                  <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Antigo Testamento</p>
                  <div className="space-y-1">
                  {oldTestamentBooks.map(book => (
                      <Button
                          key={book.abbrev.pt}
                          variant="ghost"
                          className="w-full justify-start text-base"
                          onClick={() => onBookSelect(book)}
                      >
                          {book.name}
                      </Button>
                  ))}
                  </div>
              </div>
          )}
          {newTestamentBooks.length > 0 && (
              <div>
                  <p className="text-sm font-semibold text-muted-foreground px-2 py-1">Novo Testamento</p>
                   <div className="space-y-1">
                  {newTestamentBooks.map(book => (
                      <Button
                          key={book.abbrev.pt}
                          variant="ghost"
                          className="w-full justify-start text-base"
                          onClick={() => onBookSelect(book)}
                      >
                          {book.name}
                      </Button>
                  ))}
                  </div>
              </div>
          )}
      </ScrollArea>
    </div>
  );
}
