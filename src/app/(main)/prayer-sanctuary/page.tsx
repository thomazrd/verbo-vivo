

"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import type { Prayer, Mission, BattlePlan } from '@/lib/types';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { processPrayer } from '@/ai/flows/prayer-reflection';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Mic, Square, Loader2, History, Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PrayerResponseCard } from '@/components/prayer/PrayerResponseCard';
import { PlanCreationModal } from '@/components/chat/PlanCreationModal';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { MissionCompletionModal } from '@/components/battle-plans/MissionCompletionModal';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AudioChart = dynamic(() => import('@/components/prayer/AudioChart'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-24" />,
});


type SanctuaryState = 'idle' | 'recording' | 'processing' | 'response';

// PrayerHistoryList Component (Internal)
function PrayerHistoryList({ userId }: { userId: string }) {
    const { t } = useTranslation();
    const [history, setHistory] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeAgo, setTimeAgo] = useState<Record<string, string>>({});

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

    useEffect(() => {
      const updateTimes = () => {
        if (history.length > 0) {
          const newTimes: Record<string, string> = {};
          history.forEach(p => {
              if (p.createdAt) {
                  newTimes[p.id] = formatDistanceToNow(p.createdAt.toDate(), { addSuffix: true, locale: ptBR });
              }
          });
          setTimeAgo(newTimes);
        }
      }
      updateTimes();
      // Optional: set an interval to update times periodically
      const intervalId = setInterval(updateTimes, 60000); // every minute
      return () => clearInterval(intervalId);
    }, [history]);

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
                                {timeAgo[prayer.id] || ''}
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

function PrayerSanctuaryContent() {
  const { t, i18n } = useTranslation();
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  
  const isMission = searchParams.get('mission') === 'true';
  const userPlanId = searchParams.get('userPlanId');
  const missionId = searchParams.get('missionId');

  const { toast } = useToast();
  const [sanctuaryState, setSanctuaryState] = useState<SanctuaryState>('idle');
  const [missionContext, setMissionContext] = useState<Mission | null>(null);
  const [latestResponse, setLatestResponse] = useState<{responseText: string, citedVerses: any[]}| null>(null);
  const [processingText, setProcessingText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [typedPrayer, setTypedPrayer] = useState("");
  
  const [missionToComplete, setMissionToComplete] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Fetch mission context if params are present
    const fetchMissionContext = async () => {
      if (!user || !userPlanId || !missionId) return;
      try {
        const userPlanRef = doc(db, 'users', user.uid, 'battlePlans', userPlanId);
        const userPlanSnap = await getDoc(userPlanRef);
        if (userPlanSnap.exists()) {
          const planDefRef = doc(db, 'battlePlans', userPlanSnap.data().planId);
          const planDefSnap = await getDoc(planDefRef);
          if (planDefSnap.exists()) {
            const planDef = planDefSnap.data() as BattlePlan;
            const mission = planDef.missions.find(m => m.id === missionId);
            setMissionContext(mission || null);
          }
        }
      } catch (error) {
        console.error("Error fetching mission context:", error);
      }
    };
    fetchMissionContext();
  }, [isMission, userPlanId, missionId, user]);

  const [audioData, setAudioData] = useState<Array<{ value: number }>>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { isListening, transcript, startListening, stopListening, error } = useSpeechToText({
      onTranscriptChange: (newTranscript) => {
        setTypedPrayer(newTranscript);
      }
  });

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
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) {
        console.error("AudioContext not supported");
        toast({ variant: 'destructive', title: 'Erro de Áudio', description: 'Seu navegador não suporta a visualização de áudio.' });
        return;
    }
    const audioContext = new AudioContext();
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
  }, [toast]);

  const handleStartRecording = async () => {
    if (isListening) return;
    setTypedPrayer('');
    setProcessingText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      visualizeAudio(stream);
      startListening(); // Hook will use the already granted permission
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({ variant: 'destructive', title: 'Erro de Microfone', description: 'Não foi possível acessar seu microfone. Verifique as permissões do navegador.' });
    }
  };
  
  const processAndSubmitPrayer = async (prayerText: string) => {
      setProcessingText(prayerText);
      setSanctuaryState('processing');

      if (!prayerText) {
          toast({ title: "Nenhuma oração detectada.", description: "Tente falar um pouco mais alto e claro, ou digite sua oração.", variant: "destructive"});
          setSanctuaryState('idle');
          setProcessingText("");
          return;
      }
      
      if(!user) return;

      try {
          const result = await processPrayer({ 
              model: userProfile?.preferredModel, 
              language: userProfile?.preferredLanguage || i18n.language,
              prayerText 
          });
          await addDoc(collection(db, "prayers"), {
              userId: user.uid,
              prayerText,
              responseText: result.responseText,
              citedVerses: result.citedVerses,
              createdAt: serverTimestamp(),
          });
          setLatestResponse(result);
          setSanctuaryState('response');
          // Mission completion is now handled by user action
      } catch (err) {
          console.error("Error processing prayer:", err);
          toast({
              title: "Erro ao processar sua oração.",
              description: "Não foi possível encontrar uma passagem neste momento, mas saiba que Deus ouviu sua oração.",
              variant: "destructive"
          });
          setSanctuaryState('idle');
      }
  }

  const handleStopRecording = () => {
    stopListening();
    cleanupAudio();
    // A oração já está em `typedPrayer` por causa do onTranscriptChange
  };

  const handleSendPrayer = () => {
      const prayerText = (isListening ? transcript : typedPrayer).trim();
      if (isListening) {
          stopListening();
          cleanupAudio();
      }
      processAndSubmitPrayer(prayerText);
  }
  
  const handleReset = () => {
    setLatestResponse(null);
    setProcessingText("");
    setTypedPrayer("");
    cleanupAudio();
    setSanctuaryState('idle');
    setMissionContext(null); // Clear mission context on reset
  }

  const handleCompleteMission = () => {
      if (missionUserPlanId) {
          setMissionToComplete(missionUserPlanId);
      }
  }

  const handleModalClose = () => {
      setMissionToComplete(null);
      handleReset();
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
        cleanupAudio();
    };
  }, [cleanupAudio]);

  const renderMainContent = () => {
    if (!isClient) {
      return (
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-full max-w-md" />
          <Skeleton className="h-12 w-48" />
        </div>
      );
    }
    
    switch (sanctuaryState) {
        case 'recording':
            return (
                <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                     {missionContext && (
                        <Card className="w-full bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="text-primary text-base flex items-center gap-2"><MessageSquare /> Missão de Oração</CardTitle>
                                <CardDescription className="text-primary/80">{missionContext.title}</CardDescription>
                            </CardHeader>
                        </Card>
                     )}
                     <div className="w-full p-4 border bg-muted/50 rounded-lg min-h-[200px] flex flex-col">
                        {isListening && <div className="w-full h-24 mb-4"><AudioChart data={audioData} /></div>}
                        <Textarea
                        value={typedPrayer}
                        onChange={(e) => setTypedPrayer(e.target.value)}
                        placeholder={isListening ? 'Ouvindo sua oração...' : 'Se preferir, pode digitar aqui...'}
                        className="w-full h-full bg-transparent border-none focus-visible:ring-0 resize-none p-0 text-base flex-1"
                        />
                    </div>
                     <div className="flex items-center gap-4">
                        <Button
                            size="lg"
                            onClick={isListening ? handleStopRecording : handleStartRecording}
                            className={cn("w-28", isListening && 'bg-destructive hover:bg-destructive/90')}
                        >
                            {isListening ? (
                                <Square className="mr-2 h-5 w-5" />
                            ) : (
                                <Mic className="mr-2 h-5 w-5" />
                            )}
                            {isListening ? 'Parar' : 'Falar'}
                        </Button>
                        <Button size="lg" className="w-28" onClick={handleSendPrayer} disabled={!typedPrayer.trim()}>
                            <Send className="mr-2 h-5 w-5" />
                            Enviar
                        </Button>
                    </div>
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
                return <PrayerResponseCard 
                    responseText={latestResponse.responseText} 
                    citedVerses={latestResponse.citedVerses}
                    prayerTopic={processingText}
                    onReset={handleReset} 
                    onCreatePlan={() => setIsPlanModalOpen(true)}
                    isMission={isMission}
                    onCompleteMission={handleCompleteMission}
                />
            }
            return null;
        case 'idle':
        default:
            return (
                <div className="flex flex-col items-center gap-6">
                    <h1 className="text-4xl font-bold tracking-tight text-center">{t('sanctuary_title')}</h1>
                    <p className="text-lg text-muted-foreground max-w-md text-center">Um lugar de calma e reflexão para derramar seu coração diante de Deus.</p>
                    <Button onClick={() => setSanctuaryState('recording')} size="lg">
                        <Mic className="mr-2 h-5 w-5" />
                        {t('pray_now_button')}
                    </Button>
                </div>
            )
    }
  }

  return (
    <>
    <div className="container mx-auto flex flex-col items-center justify-center min-h-full py-8 px-4 gap-8">
      {renderMainContent()}
      {user && sanctuaryState === 'idle' && isClient && <PrayerHistoryList userId={user.uid} />}
    </div>
    <PlanCreationModal 
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        topic={processingText}
    />
    {missionToComplete && (
      <MissionCompletionModal
        userPlanId={missionToComplete}
        onClose={handleModalClose}
      />
    )}
    </>
  );
}


export default function PrayerSanctuaryPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <PrayerSanctuaryContent />
        </Suspense>
    )
}
