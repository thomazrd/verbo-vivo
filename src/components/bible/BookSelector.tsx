
"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import type { BibleBook } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookSelectorProps {
  onBookSelect: (book: BibleBook) => void;
  selectedBookAbbrev?: string;
}

const normalizeString = (str: string) => 
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function BookSelector({ onBookSelect, selectedBookAbbrev }: BookSelectorProps) {
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

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

  const filteredBooks = books.filter(book => 
    normalizeString(book.name).includes(normalizeString(searchTerm))
  );
  
  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'VT');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'NT');

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
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
    <div className="flex flex-col gap-2">
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
      <ScrollArea className="h-full max-h-[calc(70vh-50px)] rounded-md border">
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
