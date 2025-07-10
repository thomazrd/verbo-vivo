"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookText, X } from 'lucide-react';

interface SummaryDisplayProps {
  summary: string | null;
  isLoading: boolean;
  onHide: () => void;
}

export function SummaryDisplay({ summary, isLoading, onHide }: SummaryDisplayProps) {
  if (isLoading) {
    return (
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
            <CardTitle className="flex items-center text-lg gap-2">
                <BookText className="h-5 w-5" />
                Resumo do Capítulo
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card className="mb-6 bg-muted/50 animate-in fade-in-50">
      <CardHeader>
        <div className="flex items-start justify-between">
            <CardTitle className="flex items-center text-lg gap-2">
                <BookText className="h-5 w-5" />
                Resumo do Capítulo
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-2 shrink-0" onClick={onHide}>
                <X className="h-4 w-4" />
                <span className="sr-only">Esconder Resumo</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {summary}
        </p>
      </CardContent>
    </Card>
  );
}
