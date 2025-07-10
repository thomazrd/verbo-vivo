
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Prayer } from '@/lib/types';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { processPrayer } from '@/ai/flows/prayer-reflection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Mic, Square, Loader2, HeartHandshake, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, YAxis } from "recharts";


type SanctuaryState = 'idle' | 'recording' | 'processing' | 'response';

// PrayerResponseCard Component (Internal)
function PrayerResponseCard({ responseText, citedVerses, onReset }: { responseText: string, citedVerses: string[], onReset: () => void }) {
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
        <div className="text-center pt-4">
            <Button onClick={onReset}>{t('pray_again_button')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// PrayerHistoryList Component (Internal)
function PrayerHistoryList({ userId }: { userId: string }) {
    const { t } = useTranslation();
    const [history, setHistory] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "prayers"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prayers: Prayer[] = [];
            snapshot.forEach(doc => prayers.push({ id: doc.id, ...doc.data()} as Prayer));
            setHistory(prayers);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    if (loading) {
        return <Skeleton className="h-20 w-full" />;
    }

    if (history.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-2xl mt-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <History className="h-5 w-5" />
                {t('prayer_history_title')}
            </h2>
            <Accordion type="single" collapsible>
                {history.map(prayer => (
                    <AccordionItem value={prayer.id} key={prayer.id}>
                        <AccordionTrigger>
                           <div className="flex justify-between w-full pr-4">
                            <span className="truncate">"{prayer.prayerText.substring(0, 50)}..."</span>
                            <span className="text-xs text-muted-foreground shrink-0 ml-4">
                                {prayer.createdAt ? formatDistanceToNow(prayer.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : ''}
                            </span>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                            <h4 className="font-semibold mb-2 text-primary">Sua Oração:</h4>
                            <p className="text-muted-foreground italic">"{prayer.prayerText}"</p>
                            <h4 className="font-semibold mt-4 mb-2 text-primary">Reflexão Recebida:</h4>
                            <div dangerouslySetInnerHTML={{ __html: prayer.responseText.replace(/([A-Za-z]+\s\d+:\d+(-\d+)?)/g, '<strong class="font-semibold">$1</strong>') }} />
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}

export default function PrayerSanctuaryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sanctuaryState, setSanctuaryState] = useState<SanctuaryState>('idle');
  const [latestResponse, setLatestResponse] = useState<{responseText: string, citedVerses: string[]}| null>(null);
  const [processingText, setProcessingText] = useState("");

  const [audioData, setAudioData] = useState<Array<{ value: number }>>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({});

  useEffect(() => {
    if (error) {
        toast({ variant: 'destructive', title: 'Erro de Microfone', description: error });
        setSanctuaryState('idle');
    }
  }, [error, toast]);

  const cleanupAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    streamRef.current = null;
    audioContextRef.current = null;
    animationFrameRef.current = null;
  }, []);

  const visualizeAudio = useCallback((stream: MediaStream) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const sampleSize = 32;
      const processedData = [];
      const step = Math.floor(bufferLength / sampleSize);
      for (let i = 0; i < sampleSize; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j];
        }
        processedData.push({ value: sum / step });
      }
      setAudioData(processedData);
    };
    draw();
  }, []);

  const handleStart = async () => {
    if (isListening) return;
    setProcessingText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      visualizeAudio(stream);
      startListening(); // Hook will use the already granted permission
      setSanctuaryState('recording');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ variant: 'destructive', title: 'Erro de Microfone', description: 'Não foi possível acessar seu microfone. Verifique as permissões do navegador.' });
    }
  };
  
  const handleStop = async () => {
    stopListening();
    cleanupAudio();
    
    const prayerText = transcript.trim();
    setProcessingText(prayerText);
    setSanctuaryState('processing');

    if (!prayerText) {
        toast({ title: "Nenhuma oração detectada.", description: "Tente falar um pouco mais alto e claro.", variant: "destructive"});
        setSanctuaryState('idle');
        setProcessingText("");
        return;
    }
    
    if(!user) return;

    try {
        const result = await processPrayer({ prayerText });
        await addDoc(collection(db, "prayers"), {
            userId: user.uid,
            prayerText,
            responseText: result.responseText,
            citedVerses: result.citedVerses,
            createdAt: serverTimestamp(),
        });
        setLatestResponse(result);
        setSanctuaryState('response');
    } catch (err) {
        console.error("Error processing prayer:", err);
        toast({
            title: "Erro ao processar sua oração.",
            description: "Não foi possível encontrar uma passagem neste momento, mas saiba que Deus ouviu sua oração.",
            variant: "destructive"
        });
        setSanctuaryState('idle');
    }
  };
  
  const handleReset = () => {
    setLatestResponse(null);
    setProcessingText("");
    cleanupAudio();
    setSanctuaryState('idle');
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        cleanupAudio();
    };
  }, [cleanupAudio]);

  const renderMainContent = () => {
    switch (sanctuaryState) {
        case 'recording':
            return (
                <div className="flex flex-col items-center gap-6 w-full max-w-md">
                    <div className="w-full h-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={audioData} barGap={2} margin={{top:10, right: 10, bottom: 10, left: 10}}>
                                <YAxis domain={[0, 256]} hide />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xl text-muted-foreground">Ouvindo...</p>
                    <Button onClick={handleStop} size="lg" variant="destructive">
                        <Square className="mr-2 h-5 w-5" />
                        Encerrar Oração
                    </Button>
                </div>
            )
        case 'processing':
            return (
                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                    {processingText && (
                        <div className="p-4 rounded-lg bg-muted/50 w-full animate-in fade-in-0">
                            <p className="text-sm text-center italic text-muted-foreground line-clamp-3">
                                "{processingText}"
                            </p>
                        </div>
                    )}
                    <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    <p className="text-xl text-muted-foreground text-center">Buscando na Palavra uma resposta de paz...</p>
                </div>
            )
        case 'response':
            if (latestResponse) {
                return <PrayerResponseCard {...latestResponse} onReset={handleReset} />
            }
            return null; // Should not happen
        case 'idle':
        default:
            return (
                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-4xl font-bold tracking-tight text-center">{t('sanctuary_title')}</h1>
                    <p className="text-lg text-muted-foreground max-w-md text-center">Um lugar de calma e reflexão para derramar seu coração diante de Deus.</p>
                    <Button onClick={handleStart} size="lg">
                        <Mic className="mr-2 h-5 w-5" />
                        {t('pray_now_button')}
                    </Button>
                </div>
            )
    }
  }

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-full py-8 px-4 gap-8">
      {renderMainContent()}
      {user && sanctuaryState === 'idle' && <PrayerHistoryList userId={user.uid} />}
    </div>
  );
}
