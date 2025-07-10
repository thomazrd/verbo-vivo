"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BibleBook, BibleChapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VerseDisplayProps {
  book: BibleBook;
  chapter: number;
  onBack: () => void;
}

export function VerseDisplay({ book, chapter, onBack }: VerseDisplayProps) {
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setChapterData(null);
      try {
        // A versão 'nvi' está fixa por enquanto, mas pode ser tornada dinâmica no futuro.
        const response = await axios.get(`/api/bible/verses/nvi/${book.abbrev.pt}/${chapter}`);
        setChapterData(response.data);
      } catch (err) {
        console.error("Erro ao buscar capítulo:", err);
        setError("Não foi possível carregar o capítulo. Tente novamente mais tarde.");
         toast({
            variant: "destructive",
            title: "Erro de API",
            description: "Não foi possível carregar o conteúdo do capítulo."
        });
      } finally {
        setLoading(false);
      }
    };

    if (book && chapter) {
      fetchChapter();
    }
  }, [book, chapter]);

  if (loading) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-8 w-8 rounded-md" />
                 <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-full" />
        </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!chapterData) {
    return null;
  }

  return (
    <Card>
         <CardHeader>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Voltar para capítulos</span>
                </Button>
                <div>
                    <CardTitle className="text-2xl">{chapterData.book.name} {chapterData.chapter.number}</CardTitle>
                    <CardDescription>{chapterData.book.testament === 'VT' ? 'Antigo Testamento' : 'Novo Testamento'}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
        {chapterData.verses.map(verse => (
          <p key={verse.number} className="leading-relaxed">
            <sup className="font-bold text-primary mr-2">{verse.number}</sup>
            {verse.text}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}