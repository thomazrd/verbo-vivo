
"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import type { BibleChapter, BibleVerseContent, BibleBook } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

interface VerseSelectorProps {
  onVerseSelected: (verseContent: BibleVerseContent) => void;
  onCancel: () => void;
}

export function VerseSelector({ onVerseSelected, onCancel }: VerseSelectorProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [books, setBooks] = useState<BibleBook[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);

  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [startVerse, setStartVerse] = useState<string>('');
  const [endVerse, setEndVerse] = useState<string>('');

  const [isLoadingVerse, setIsLoadingVerse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedVerse, setFetchedVerse] = useState<BibleVerseContent | null>(null);

  const bibleVersion = userProfile?.preferredBibleVersion || { id: 'nvi', name: 'NVI', apiSource: 'abibliadigital' };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get('/api/bible/books');
        setBooks(response.data);
      } catch (error) {
        console.error("Failed to fetch Bible books", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os livros da Bíblia.' });
      } finally {
        setIsLoadingBooks(false);
      }
    };
    fetchBooks();
  }, [toast]);

  const fetchFullVerse = useCallback(async () => {
    if (!selectedBook || !selectedChapter || !startVerse) {
        setFetchedVerse(null);
        return;
    }
    
    setError(null);
    setIsLoadingVerse(true);

    try {
      const response = await axios.get<BibleChapter>(`/api/bible/verses/${bibleVersion.id}/${selectedBook.abbrev.pt}/${selectedChapter}`);
      const chapterData = response.data;
      
      const start = parseInt(startVerse);
      const end = endVerse ? parseInt(endVerse) : start;

      const verses = chapterData.verses
        .filter(v => v.number >= start && v.number <= end)
        .map(v => v.text);

      if (verses.length > 0) {
        const reference = `${selectedBook.name} ${selectedChapter}:${startVerse}${endVerse && endVerse !== start ? `-${endVerse}` : ''}`;
        setFetchedVerse({
          reference: reference,
          text: verses.join(' '),
          version: bibleVersion.name,
        });
      } else {
        setError("Versículo não encontrado. Verifique a referência.");
        setFetchedVerse(null);
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível buscar o versículo.");
      setFetchedVerse(null);
    } finally {
      setIsLoadingVerse(false);
    }
  }, [selectedBook, selectedChapter, startVerse, endVerse, bibleVersion.id, bibleVersion.name]);

  useEffect(() => {
    fetchFullVerse();
  }, [fetchFullVerse]);


  const handleConfirm = () => {
    if (fetchedVerse) {
      onVerseSelected(fetchedVerse);
      toast({ title: "Versículo Anexado!", description: "Sua postagem está pronta para ser compartilhada." });
    }
  };
  
  const handleBookChange = (bookId: string) => {
    const book = books.find(b => b.id === bookId) || null;
    setSelectedBook(book);
    setSelectedChapter('');
    setStartVerse('');
    setEndVerse('');
    setFetchedVerse(null);
  }

  const chapters = selectedBook ? Array.from({ length: selectedBook.chapters }, (_, i) => i + 1) : [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Compartilhar Versículo</DialogTitle>
        <DialogDescription>
          Selecione o livro, capítulo e versículo(s) que deseja compartilhar.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 p-1" onMouseDown={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
           <Select onValueChange={handleBookChange} value={selectedBook?.id || ""} disabled={isLoadingBooks}>
              <SelectTrigger><SelectValue placeholder={isLoadingBooks ? "Carregando..." : "Escolha um livro"} /></SelectTrigger>
              <SelectContent>
                  {books.map(book => (
                      <SelectItem key={book.id || book.name} value={book.id || ''}>{book.name}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
          <Select onValueChange={setSelectedChapter} value={selectedChapter} disabled={!selectedBook}>
              <SelectTrigger><SelectValue placeholder="Capítulo" /></SelectTrigger>
              <SelectContent>
                  {chapters.map(c => (
                      <SelectItem key={c} value={String(c)}>{c}</SelectItem>
                  ))}
              </SelectContent>
          </Select>
        </div>
         <div className="grid grid-cols-2 gap-2">
             <Input type="number" placeholder="Verso inicial" value={startVerse} onChange={e => setStartVerse(e.target.value)} disabled={!selectedChapter} />
             <Input type="number" placeholder="Verso final (opc)" value={endVerse} onChange={e => setEndVerse(e.target.value)} disabled={!startVerse} />
         </div>
        
        {isLoadingVerse && (
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Buscando...
          </div>
        )}
        {error && !isLoadingVerse && (
          <div className="flex items-center p-2 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        {fetchedVerse && !isLoadingVerse && (
          <Card>
              <CardContent className="p-4">
                  <blockquote className="italic text-card-foreground">
                      “{fetchedVerse.text}”
                  </blockquote>
                  <p className="text-right font-semibold text-primary mt-2">
                      — {fetchedVerse.reference} ({fetchedVerse.version})
                  </p>
              </CardContent>
          </Card>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={!fetchedVerse || isLoadingVerse}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Confirmar Versículo
        </Button>
      </DialogFooter>
    </>
  );
}
