
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { bibleBooksByAbbrev } from '@/lib/bible-books-by-abbrev';
import type { BibleChapter, BibleVersion } from '@/lib/types';

interface VerseViewerProps {
  verseReference: string;
  isOpen: boolean;
}

// Função simples para extrair informações da referência. Ex: "Gn 1:1-5" ou "Sl 23"
function parseVerseReference(ref: string) {
  const match = ref.match(/^([a-zA-Z0-9]+)\s+(\d+)(?::(\d+))?(?:-(\d+))?$/);
  if (!match) return null;

  const [, bookAbbrev, chapter, startVerse, endVerse] = match;
  
  const book = bibleBooksByAbbrev[bookAbbrev.toLowerCase()];
  if (!book) return null;

  return {
    bookAbbrev: book.abbrev.pt,
    chapter: parseInt(chapter),
    startVerse: startVerse ? parseInt(startVerse) : 1,
    endVerse: endVerse ? parseInt(endVerse) : (startVerse ? parseInt(startVerse) : book.chapters)
  };
}

export function VerseViewer({ verseReference, isOpen }: VerseViewerProps) {
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Usamos uma versão fixa para simplicidade no plano de estudo
  const version: BibleVersion = { id: 'nvi', name: 'NVI', language: 'pt', apiSource: 'abibliadigital' };
  
  useEffect(() => {
    if (!isOpen || chapterData) return;

    const fetchVerses = async () => {
      setLoading(true);
      setError(null);

      const parsedRef = parseVerseReference(verseReference);
      if (!parsedRef) {
        setError("Referência de versículo inválida.");
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`/api/bible/verses/${version.id}/${parsedRef.bookAbbrev}/${parsedRef.chapter}`);
        setChapterData(response.data);
      } catch (err) {
        console.error("Erro ao buscar versículos:", err);
        setError("Não foi possível carregar os versículos.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerses();

  }, [isOpen, verseReference, chapterData, version.id]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!chapterData) return null;
  
  const parsedRef = parseVerseReference(verseReference);
  const versesToDisplay = chapterData.verses.filter(v => 
    v.number >= (parsedRef?.startVerse || 1) && v.number <= (parsedRef?.endVerse || chapterData.verses.length)
  );

  return (
    <div className="space-y-4 text-card-foreground/90">
      {versesToDisplay.map(verse => (
        <p key={verse.number} className="leading-relaxed">
          <sup className="font-bold text-primary mr-2">{verse.number}</sup>
          {verse.text}
        </p>
      ))}
    </div>
  );
}
