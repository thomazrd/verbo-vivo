"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import type { BibleBook } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface BookSelectorProps {
  onBookSelect: (book: BibleBook) => void;
  selectedBookAbbrev?: string;
}

export function BookSelector({ onBookSelect, selectedBookAbbrev }: BookSelectorProps) {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await axios.get<BibleBook[]>('/api/bible/books');
        
        const oldTestament = response.data.filter(book => book.testament === 'VT');
        const newTestament = response.data.filter(book => book.testament === 'NT');

        setBooks([...oldTestament, ...newTestament]);
        setError(null);
      } catch (err) {
        console.error("Erro ao buscar livros:", err);
        setError("Não foi possível carregar os livros. Verifique o token da API.");
        toast({
            variant: "destructive",
            title: "Erro de API",
            description: "Não foi possível carregar os livros. O token da API pode estar faltando ou ser inválido."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, [toast]);

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
        </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <ScrollArea className="h-full max-h-[70vh] rounded-md border">
      <div className="p-2">
        <h3 className="font-semibold text-lg px-2 py-1 mb-1">Livros</h3>
        {books.map((book, index) => (
          <div key={book.abbrev.pt}>
            {index === 0 && <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mt-2">Antigo Testamento</p>}
            {book.testament === 'NT' && books[index-1]?.testament === 'VT' && <p className="text-sm font-semibold text-muted-foreground px-2 py-1 mt-4">Novo Testamento</p>}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left",
                selectedBookAbbrev === book.abbrev.pt && "bg-muted font-bold text-primary"
              )}
              onClick={() => onBookSelect(book)}
            >
              {book.name}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}