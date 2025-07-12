
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import type { FeelingJourneyStep, ProcessFeelingReportOutput, BibleVerse } from '@/lib/types';
import { Emotion, Smile, Frown, Annoyed, Angry, Meh, Hand, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';

import { EmotionSelector, feelingOptions, EmotionOption } from '@/components/feeling-journey/EmotionSelector';
import { VoiceReportStep } from '@/components/feeling-journey/VoiceReportStep';
import { BibleResponseStep } from '@/components/feeling-journey/BibleResponseStep';
import { JourneyConclusion } from '@/components/feeling-journey/JourneyConclusion';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type JourneyStatus = 'disclaimer' | 'selecting_emotion' | 'reporting' | 'responding' | 'reassessing' | 'concluding' | 'stopped';

const MAX_CYCLES = 3;

export default function FeelingJourneyPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<JourneyStatus>('disclaimer');
  const [currentCycle, setCurrentCycle] = useState(0);
  const [journeySteps, setJourneySteps] = useState<FeelingJourneyStep[]>([]);
  
  const [currentEmotion, setCurrentEmotion] = useState<EmotionOption | null>(null);
  const [currentReport, setCurrentReport] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<ProcessFeelingReportOutput | null>(null);

  const startJourney = (emotion: EmotionOption) => {
    setCurrentEmotion(emotion);
    setStatus('reporting');
  };

  const handleReportSubmit = (reportText: string) => {
    setCurrentReport(reportText);
    setStatus('responding');
  };

  const handleResponseRead = (aiResponse: ProcessFeelingReportOutput) => {
    setCurrentResponse(aiResponse);
    setStatus('reassessing');
  };

  const handleReassessment = (newEmotion: EmotionOption) => {
    const newStep: FeelingJourneyStep = {
      stepNumber: currentCycle + 1,
      emotionBefore: currentEmotion!.name,
      userReportText: currentReport,
      aiResponseText: currentResponse!.responseText,
      citedVerses: currentResponse!.citedVerses,
      emotionAfter: newEmotion.name,
    };
    const updatedSteps = [...journeySteps, newStep];
    setJourneySteps(updatedSteps);

    if (newEmotion.type === 'positive' || currentCycle >= MAX_CYCLES - 1) {
      saveJourney(updatedSteps, 'COMPLETED');
      setStatus('concluding');
    } else {
      setCurrentEmotion(newEmotion);
      setCurrentCycle(prev => prev + 1);
      setStatus('reporting');
    }
  };
  
  const handleStopJourney = () => {
    if (journeySteps.length > 0) {
        saveJourney(journeySteps, 'INTERRUPTED');
    }
    setStatus('stopped');
  }

  const saveJourney = async (finalSteps: FeelingJourneyStep[], finalStatus: 'COMPLETED' | 'INTERRUPTED') => {
    if (!user || finalSteps.length === 0) return;

    try {
      await addDoc(collection(db, 'feelingJourneys'), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: finalStatus,
        initialEmotion: finalSteps[0].emotionBefore,
        finalEmotion: finalSteps[finalSteps.length - 1].emotionAfter,
        steps: finalSteps,
      });
    } catch (error) {
      console.error("Error saving journey:", error);
      // Non-critical error, user can continue.
    }
  };
  
  const renderStep = () => {
    switch (status) {
      case 'disclaimer':
        return (
            <div className="w-full max-w-2xl mx-auto text-center p-4">
                 <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                 <h1 className="text-2xl font-bold">Boas-vindas à Jornada de Sentimentos</h1>
                 <p className="text-muted-foreground mt-4">
                    Esta é uma ferramenta de reflexão espiritual para te ajudar a processar suas emoções à luz da Bíblia. Ela não é terapia nem aconselhamento médico.
                 </p>
                 <p className="font-semibold mt-4">
                    Se você está em crise ou precisa de ajuda profissional, por favor, busque um psicólogo, um médico ou a liderança da sua igreja. O Verbo Vivo se importa com você.
                 </p>
                 <Button className="mt-8" size="lg" onClick={() => setStatus('selecting_emotion')}>
                    Entendi, quero começar
                 </Button>
            </div>
        );
      case 'selecting_emotion':
        return <EmotionSelector onSelectEmotion={startJourney} title="Como você está se sentindo agora?" />;
      case 'reporting':
        return <VoiceReportStep emotion={currentEmotion!} onSubmit={handleReportSubmit} />;
      case 'responding':
        return <BibleResponseStep emotion={currentEmotion!} reportText={currentReport} onResponseReady={handleResponseRead} />;
      case 'reassessing':
        return <EmotionSelector onSelectEmotion={handleReassessment} title="E agora, como você se sente?" />;
      case 'concluding':
        return <JourneyConclusion initialEmotion={journeySteps[0]?.emotionBefore} finalEmotion={journeySteps[journeySteps.length-1]?.emotionAfter} onReset={() => setStatus('selecting_emotion')} />;
      case 'stopped':
         return <JourneyConclusion wasStopped onReset={() => setStatus('selecting_emotion')} />;
    }
  };

  const showStopButton = status !== 'disclaimer' && status !== 'selecting_emotion' && status !== 'concluding' && status !== 'stopped';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>
      {showStopButton && (
        <div className="p-4 text-center">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="text-muted-foreground">Parar Jornada</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza que deseja parar?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Seu progresso será salvo, mas a jornada será marcada como interrompida. Você pode começar uma nova a qualquer momento.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Continuar Jornada</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStopJourney}>Sim, parar agora</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )}
    </div>
  );
}
