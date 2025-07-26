
"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Sparkles } from 'lucide-react';
import type { BibleVerse } from '@/lib/types';
import { VerseCard } from '../chat/VerseCard';

interface PrayerResponseCardProps {
    responseText: string;
    citedVerses: BibleVerse[];
    prayerTopic: string;
    onReset: () => void;
    onCreatePlan: () => void;
}

export function PrayerResponseCard({ responseText, citedVerses, prayerTopic, onReset, onCreatePlan }: PrayerResponseCardProps) {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-6 w-6 text-primary" />
          {t('word_of_peace_title')}
        </CardTitle>
        <CardDescription>
          Uma reflexão baseada em sua oração e nas Escrituras.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: responseText }} />
        
        {citedVerses.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold text-sm">Versículos Citados:</h4>
            {citedVerses.map((v, index) => (
                <VerseCard key={index} reference={v.reference} text={v.text} />
            ))}
          </div>
        )}

        <div className="flex justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={onReset}>{t('pray_again_button')}</Button>
            <Button onClick={onCreatePlan}>
                <Sparkles className="mr-2 h-4 w-4"/>
                Criar Plano de Estudo
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
