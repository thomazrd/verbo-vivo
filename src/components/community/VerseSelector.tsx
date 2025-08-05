
"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/use-auth';
import type { BibleChapter, BibleVerseContent } from '@/lib/types';
import { bibleBooksByAbbrev } from '@/lib/bible-books-by-abbrev';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface VerseSelectorProps {
  onVerseSelected: (verseContent: BibleVerseContent) => void;
}

// Function to parse references like "John 3:16" or "John 3:16-18"
function parseVerseReference(ref: string) {
  const match = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;

  const [, bookName, chapter, startVerse, endVerse] = match;
  
  const normalizedBookName = bookName.trim().replace(/^[0-9]+[ªº]?\s*/, '').toLowerCase();

  const bookAbbrev = Object.keys(bibleBooksByAbbrev).find(abbrev => {
    const bookData = bibleBooksByAbbrev[abbrev];
    const normalizedBookDataName = bookData.name.replace(/^[0-9]+[ªº]?\s*/, '').toLowerCase();
    
    return abbrev === normalizedBookName || 
           normalizedBookDataName === normalizedBookName ||
           bookData.name.toLowerCase() === bookName.trim().toLowerCase();
  });

  const book = bookAbbrev ? bibleBooksByAbbrev[bookAbbrev] : null;
  if (!book) return null;

  return {
    bookAbbrev: book.abbrev.pt,
    chapter: parseInt(chapter, 10),
    startVerse: parseInt(startVerse, 10),
    endVerse: endVerse ? parseInt(endVerse, 10) : parseInt(startVerse, 10),
  };
}

export function VerseSelector({ onVerseSelected }: VerseSelectorProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [reference, setReference] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedVerse, setFetchedVerse] = useState<BibleVerseContent | null>(null);

  const bibleVersion = userProfile?.preferredBibleVersion || { id: 'nvi', name: 'NVI' };

  const fetchVerse = useCallback(async () => {
    if (reference.length < 4) {
      setFetchedVerse(null);
      return;
    };

    const parsedRef = parseVerseReference(reference);
    if (!parsedRef) {
      setError('Formato da referência inválido. Use "Livro C:V".');
      setFetchedVerse(null);
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.get<BibleChapter>(`/api/bible/verses/${bibleVersion.id}/${parsedRef.bookAbbrev}/${parsedRef.chapter}`);
      const chapterData = response.data;
      
      const verses = chapterData.verses
        .filter(v => v.number >= parsedRef.startVerse && v.number <= parsedRef.endVerse)
        .map(v => v.text);

      if (verses.length > 0) {
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
      setIsLoading(false);
    }
  }, [reference, bibleVersion.id, bibleVersion.name]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchVerse();
    }, 500);
    return () => clearTimeout(debounce);
  }, [reference, fetchVerse]);

  const handleConfirm = () => {
    if (fetchedVerse) {
      onVerseSelected(fetchedVerse);
      toast({ title: "Versículo Anexado!", description: "Sua postagem está pronta para ser compartilhada." });
    }
  };

  return (
    <div className="space-y-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
      <Input
        placeholder="Digite uma referência bíblica (ex: João 3:16)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className="text-base"
      />
      {isLoading && (
        <div className="flex items-center justify-center p-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Buscando...
        </div>
      )}
      {error && !isLoading && (
        <div className="flex items-center p-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      {fetchedVerse && !isLoading && (
        <Card>
            <CardContent className="p-4">
                <blockquote className="italic text-card-foreground">
                    “{fetchedVerse.text}”
                </blockquote>
                <p className="text-right font-semibold text-primary mt-2">
                    — {fetchedVerse.reference} ({fetchedVerse.version})
                </p>
                <Button className="w-full mt-4" onClick={handleConfirm}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Versículo
                </Button>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
