
"use client";

import { useState, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { Button } from '@/components/ui/button';
import { Mic, Send, Square } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const AudioChart = dynamic(() => import('@/components/prayer/AudioChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-24" />,
});

interface RecordingStepProps {
  onSubmit: (reportText: string) => void;
}

export function RecordingStep({ onSubmit }: RecordingStepProps) {
  const [text, setText] = useState('');
  const [audioData, setAudioData] = useState<Array<{ value: number }>>([]);
  const { toast } = useToast();
  const { isListening, transcript, startListening, stopListening, error, visualizeAudio } = useSpeechToText({
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
      setText('');
      visualizeAudio(setAudioData);
      startListening();
    }
  };

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Confissão vazia', description: 'Por favor, fale ou escreva algo.' });
      return;
    }
    onSubmit(text);
  };

  return (
    <motion.div
      key="recording"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6"
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Confesse seus Pecados</h1>
        <blockquote className="mt-4 p-4 border-l-4 border-primary bg-muted/50 rounded-r-lg">
            <p className="font-serif italic text-muted-foreground">"O que encobre as suas transgressões nunca prosperará, mas o que as confessa e deixa, alcançará misericórdia."</p>
            <footer className="text-right text-sm font-semibold text-primary/80 mt-2 not-italic">— Provérbios 28:13</footer>
        </blockquote>
      </div>

      <div className="w-full p-4 border bg-muted/50 rounded-lg min-h-[200px] flex flex-col">
        {isListening && <div className="w-full h-24 mb-4"><AudioChart data={audioData} /></div>}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isListening ? 'Ouvindo sua confissão...' : 'Se preferir, pode digitar aqui...'}
          className="w-full h-full bg-transparent border-none focus-visible:ring-0 resize-none p-0 text-base"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={handleMicClick}
          className={cn("w-28", isListening && 'bg-destructive hover:bg-destructive/90')}
        >
          {isListening ? (
              <Square className="mr-2 h-5 w-5" />
          ) : (
              <Mic className="mr-2 h-5 w-5" />
          )}
          {isListening ? 'Parar' : 'Falar'}
        </Button>
        <Button size="lg" className="w-28" onClick={handleSubmit} disabled={isListening || !text.trim()}>
          <Send className="mr-2 h-5 w-5" />
          Enviar
        </Button>
      </div>
       {isListening && <p className="text-sm text-primary animate-pulse">Gravando... Fale com calma.</p>}
    </motion.div>
  );
}
