
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
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';

interface VerseDisplayProps {
  version: BibleVersion;
  book: BibleBook;
  chapter: number;
  onNextChapter: () => void;
  onPrevChapter: () => void;
}

export function VerseDisplay({ version, book, chapter, onNextChapter, onPrevChapter }: VerseDisplayProps) {
  const [chapterData, setChapterData] = useState<BibleChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { toast } = useToast();
  const { i18n } = useTranslation();
  const { userProfile } = useAuth();
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
            model: userProfile?.preferredModel,
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
        <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-5 w-1/4 mb-6" />
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
    return <p className="text-destructive p-8">{error}</p>;
  }

  if (!chapterData) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
        <header className="mb-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{chapterData.book.name} {chapterData.chapter.number}</h1>
                    <p className="text-lg text-muted-foreground mt-1">{chapterData.book.testament === 'VT' ? 'Antigo Testamento' : 'Novo Testamento'}</p>
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
        </header>

        <SummaryDisplay 
            summary={summary}
            isLoading={isSummaryLoading}
            onHide={() => setSummary(null)}
        />
        
        <div className="text-lg leading-relaxed space-y-4 prose prose-lg max-w-none">
            {chapterData.verses.map(verse => (
              <p key={verse.number} className="text-card-foreground">
                <sup className="font-bold text-primary mr-2 no-underline">{verse.number}</sup>
                {verse.text}
              </p>
            ))}
        </div>
        
        <footer className="mt-12 flex justify-between border-t pt-6">
            <Button variant="outline" onClick={onPrevChapter} disabled={!hasPrevChapter}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
            </Button>
            <Button variant="outline" onClick={onNextChapter} disabled={!hasNextChapter}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
      </footer>
    </div>
  );
}
