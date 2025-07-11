
"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HeartHandshake, Sparkles } from 'lucide-react';

interface PrayerResponseCardProps {
    responseText: string;
    citedVerses: string[];
    prayerTopic: string;
    onReset: () => void;
    onCreatePlan: () => void;
}

export function PrayerResponseCard({ responseText, citedVerses, prayerTopic, onReset, onCreatePlan }: PrayerResponseCardProps) {
  const { t } = useTranslation();
  const highlightedText = responseText.replace(
    /([A-Za-z]+\s\d+:\d+(-\d+)?)/g,
    '<strong class="font-semibold text-primary">$1</strong>'
  );
  
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
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: highlightedText }} />
        {citedVerses.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Versículos Citados:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground font-mono">
              {citedVerses.map(v => <li key={v}>{v}</li>)}
            </ul>
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
