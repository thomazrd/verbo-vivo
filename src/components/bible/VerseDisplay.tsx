
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { BibleBook, BibleChapter, BibleVersion } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateChapterSummary } from '@/ai/flows/chapter-summary-generation';
import { SummaryDisplay } from './SummaryDisplay';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface VerseDisplayProps {
  version: BibleVersion;
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

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { toast } = useToast();
  const { i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Reset states on chapter change
    setSummary(null);
    setSummaryError(null);
    setIsSummaryLoading(false);
    
    const fetchChapter = async () => {
      setLoading(true);
      setError(null);
      setChapterData(null);
      try {
        const response = await axios.get(`/api/bible/verses/${version.id}/${book.abbrev.pt}/${chapter}`);
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
       // Update URL with query params
      const newUrl = `${pathname}?book=${book.abbrev.pt}&chapter=${chapter}`;
      router.replace(newUrl, { scroll: false });
      window.scrollTo(0, 0); // Scroll to top on chapter change
    }
  }, [book, chapter, version, toast, pathname, router]);

  const handleGenerateSummary = async () => {
    if (!chapterData) return;

    setIsSummaryLoading(true);
    setSummaryError(null);

    const chapterText = chapterData.verses.map(v => v.text).join(' ');

    try {
        // Use the app's current language for the summary
        const langCode = i18n.language.split('-')[0];
        const result = await generateChapterSummary({ 
            chapterText,
            language: langCode,
        });
        setSummary(result.summary);
    } catch (error: any) {
        console.error("Error generating summary:", error);
        setSummaryError("Não foi possível gerar a explicação.");
        toast({
            variant: "destructive",
            title: "Erro de IA",
            description: error.message || "Não foi possível gerar a explicação neste momento. Tente novamente."
        });
    } finally {
        setIsSummaryLoading(false);
    }
  }

  const hasPrevChapter = chapter > 1;
  const hasNextChapter = chapter < book.chapters;

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

  return (
    <Card>
         <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
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
                {!summary && !isSummaryLoading && (
                    <Button variant="outline" size="sm" onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                        {isSummaryLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Explicar...
                    </Button>
                )}
              </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
        <SummaryDisplay 
            summary={summary}
            isLoading={isSummaryLoading}
            onHide={() => setSummary(null)}
        />

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
