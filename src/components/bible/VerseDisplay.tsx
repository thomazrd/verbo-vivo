"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BibleBook, BibleChapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerseDisplayProps {
  version: string;
  book: BibleBook;
  chapter: number;
  onBack: () => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
}

export function VerseDisplay({ version, book, chapter, onBack, onNextChapter, onPrevChapter }: VerseDisplayProps) {
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setChapterData(null);
      try {
        const response = await axios.get(`/api/bible/verses/${version}/${book.abbrev.pt}/${chapter}`);
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
      window.scrollTo(0, 0); // Scroll to top on chapter change
    }
  }, [book, chapter, version, toast]);

  if (loading) {
    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-8 w-8 rounded-md" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                 </div>
            </div>
            <div className="pt-4 space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-full" />
            </div>
        </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!chapterData) {
    return null;
  }

  const hasPrevChapter = chapter > 1;
  const hasNextChapter = chapter < book.chapters;

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
      <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onPrevChapter} disabled={!hasPrevChapter}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
            </Button>
            <Button variant="outline" onClick={onNextChapter} disabled={!hasNextChapter}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
      </CardFooter>
    </Card>
  );
}
