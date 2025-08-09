
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { processFeelingReport } from '@/ai/flows/feeling-journey-flow';
import type { ProcessFeelingReportOutput } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import Link from 'next/link';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand, Mic, Square, Link as LinkIcon } from 'lucide-react';
import { VerseCard } from '@/components/chat/VerseCard';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

interface FeelingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalState = 'input' | 'loading' | 'response';

export function FeelingModal({ isOpen, onClose }: FeelingModalProps) {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();

  const [state, setState] = useState<ModalState>('input');
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState<ProcessFeelingReportOutput | null>(null);

  const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({
    onTranscriptChange: (newTranscript) => {
        setInputText(newTranscript);
    }
  });

  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Erro de Microfone', description: error });
    }
  }, [error, toast]);


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isListening) stopListening();
      onClose();
      // Reset state after a short delay to allow for fade-out animation
      setTimeout(() => {
        setState('input');
        setInputText('');
        setResponse(null);
      }, 300);
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      toast({ variant: 'destructive', title: 'Entrada vazia', description: 'Por favor, descreva como você se sente.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa estar logado para usar este recurso.' });
      return;
    }
    if (isListening) {
        stopListening();
    }

    setState('loading');
    try {
      const result = await processFeelingReport({
        model: userProfile?.preferredModel,
        language: userProfile?.preferredLanguage || i18n.language,
        emotion: 'o que sinto', // Generic emotion for this context
        reportText: inputText,
        bibleVersion: userProfile?.preferredBibleVersion?.name?.split(' ')[0] || 'NVI',
      });
      setResponse(result);
      setState('response');
    } catch (error) {
      console.error("Error processing feeling report:", error);
      toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível gerar uma reflexão. Tente novamente mais tarde.' });
      setState('input');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setInputText('');
      startListening();
    }
  }

  const renderContent = () => {
    switch(state) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Buscando na Palavra uma luz para seu coração...</p>
          </div>
        );
      case 'response':
        return response && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 pr-6">
              <p className="whitespace-pre-wrap leading-relaxed">{response.responseText}</p>
              {response.citedVerses.map((verse, index) => (
                <VerseCard key={index} reference={verse.reference} text={verse.text} version={verse.bibleVersion} />
              ))}
            </div>
          </ScrollArea>
        );
      case 'input':
      default:
        return (
          <div className="relative">
            <Textarea
                placeholder={isListening ? "Ouvindo..." : "Descreva o que você sente..."}
                className="min-h-[150px] resize-none pr-12"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
            <Button
                size="icon"
                variant="ghost"
                className={cn("absolute top-2 right-2", isListening && "text-destructive")}
                onClick={handleMicClick}
                aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação'}
            >
                {isListening ? <Square className="h-5 w-5"/> : <Mic className="h-5 w-5" />}
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary"/>
            Um Farol para seu Coração
          </DialogTitle>
          <DialogDescription>
            Compartilhe o que está em seu coração e receba uma palavra de conforto e sabedoria à luz da Bíblia.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderContent()}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {state !== 'response' ? (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={state === 'loading' || !inputText.trim()}>
                {state === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand className="mr-2 h-4 w-4" />}
                Receber Palavra
              </Button>
            </>
          ) : (
            <>
                <Button variant="ghost" asChild>
                    <Link href="/feeling-journey" onClick={() => handleOpenChange(false)}>
                         <LinkIcon className="mr-2 h-4 w-4" />
                         Iniciar Jornada Completa
                    </Link>
                </Button>
                <Button onClick={() => handleOpenChange(false)}>Fechar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
