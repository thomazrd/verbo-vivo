

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { processFeelingReport } from '@/ai/flows/feeling-journey-flow';
import type { ProcessFeelingReportOutput, EmotionOption } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerseCard } from '@/components/chat/VerseCard';
import { motion } from 'framer-motion';
import { useAiCreditManager } from '@/hooks/use-ai-credit-manager';

interface BibleResponseStepProps {
  emotion: EmotionOption;
  reportText: string;
  onResponseReady: (response: ProcessFeelingReportOutput) => void;
  language: string;
  bibleVersion: string;
}

export function BibleResponseStep({ emotion, reportText, onResponseReady, language, bibleVersion }: BibleResponseStepProps) {
  const { userProfile } = useAuth();
  const { withCreditCheck, CreditModal } = useAiCreditManager();
  const [response, setResponse] = useState<ProcessFeelingReportOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getResponse = async () => {
      try {
        const executeFeelingReport = await withCreditCheck(processFeelingReport);
        const result = await executeFeelingReport({
          model: userProfile?.preferredModel,
          language: language,
          emotion: emotion.name,
          reportText: reportText,
          bibleVersion: bibleVersion,
        });
        if (result) {
            setResponse(result);
        } else {
            // If result is null, it means the credit check failed or an error occurred.
            // The user is already notified by the hook, so we can just show a generic error here.
             setError("Não foi possível gerar a reflexão. Verifique seus créditos de IA ou tente mais tarde.");
        }
      } catch (err) {
        console.error("Error getting AI response for journey:", err);
        setError("Não foi possível carregar a reflexão. Por favor, tente novamente mais tarde.");
      }
    };
    getResponse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emotion, reportText, userProfile, language, bibleVersion]);

  if (error) {
    return (
        <>
            <CreditModal />
            <div className="text-center text-destructive">
                <p>{error}</p>
            </div>
        </>
    );
  }

  if (!response) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-2xl font-semibold">Buscando na Palavra...</h2>
        <p className="text-muted-foreground max-w-md">
          Um momento, estamos preparando uma reflexão de consolo e sabedoria para você.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="response"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Um Farol para seu Coração</h1>
        <p className="mt-2 text-muted-foreground">Leia com calma e medite sobre estas palavras.</p>
      </div>

      <div className="p-6 bg-muted/30 rounded-lg space-y-4">
        <p className="whitespace-pre-wrap leading-relaxed">{response.responseText}</p>
        
        {response.citedVerses.map((verse, index) => (
            <VerseCard key={index} reference={verse.reference} text={verse.text} version={verse.bibleVersion} />
        ))}
      </div>
      
      <div className="text-center">
        <Button size="lg" onClick={() => onResponseReady(response)}>
            Avaliar como me sinto agora
        </Button>
      </div>

    </motion.div>
  );
}
