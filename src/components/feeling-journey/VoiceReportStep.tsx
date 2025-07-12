'use client';

import { useState, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { Button } from '@/components/ui/button';
import { Mic, Send, Square, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { EmotionOption } from './EmotionSelector';
import { motion } from 'framer-motion';

interface VoiceReportStepProps {
  emotion: EmotionOption;
  onSubmit: (reportText: string) => void;
}

export function VoiceReportStep({ emotion, onSubmit }: VoiceReportStepProps) {
  const [text, setText] = useState('');
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({
    onTranscriptChange: (newTranscript) => setText(newTranscript),
  });

  useEffect(() => {
    if (error) {
      toast({ variant: 'destructive', title: 'Erro de Microfone', description: error });
    }
  }, [error, toast]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setText(''); // Clear text before starting new recording
      startListening();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Relato vazio', description: 'Por favor, fale ou escreva algo sobre como está se sentindo.' });
      return;
    }
    onSubmit(text);
  };

  return (
    <motion.div
      key="reporting"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Você está sentindo <span className={emotion.color}>{emotion.name}</span></h1>
        <p className="mt-2 text-muted-foreground">Fale abertamente sobre o porquê. Este é um espaço seguro.</p>
      </div>

      <div className="w-full p-4 border bg-muted/50 rounded-lg min-h-[150px]">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isListening ? 'Ouvindo...' : 'Se preferir, pode digitar aqui...'}
          className="w-full h-full bg-transparent border-none focus-visible:ring-0 resize-none p-0"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={handleMicClick}
          className={cn("w-24", isListening && 'bg-destructive hover:bg-destructive/90')}
        >
          {isListening ? (
              <Square className="mr-2 h-5 w-5" />
          ) : (
              <Mic className="mr-2 h-5 w-5" />
          )}
          {isListening ? 'Parar' : 'Falar'}
        </Button>
        <Button size="lg" className="w-24" onClick={handleSubmit} disabled={isListening || !text.trim()}>
          <Send className="mr-2 h-5 w-5" />
          Enviar
        </Button>
      </div>
       {isListening && <p className="text-sm text-primary animate-pulse">Gravando... Fale com calma.</p>}
    </motion.div>
  );
}
