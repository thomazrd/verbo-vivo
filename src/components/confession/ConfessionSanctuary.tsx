
"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LockKeyhole } from 'lucide-react';

import { RecordingStep } from './RecordingStep';
import { ProcessingStep } from './ProcessingStep';
import { ForgivenessStep } from './ForgivenessStep';
import { processConfession } from '@/ai/flows/confession-flow';

export type SanctuaryState = 'locked' | 'recording' | 'processing' | 'response';
export type ForgivenessResponse = {
    responseText: string;
    verses: { reference: string; text: string; }[];
}

export function ConfessionSanctuary() {
  const { user, userProfile } = useAuth();
  const { i18n } = useTranslation();
  const [sanctuaryState, setSanctuaryState] = useState<SanctuaryState>('locked');
  const [confessionText, setConfessionText] = useState('');
  const [forgivenessResponse, setForgivenessResponse] = useState<ForgivenessResponse | null>(null);
  
  const holdTimer = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  const handleHoldStart = () => {
    controls.start({
      pathLength: 1,
      transition: { duration: 1.5, ease: 'easeInOut' }
    });
    holdTimer.current = setTimeout(() => {
      setSanctuaryState('recording');
    }, 1500);
  };

  const handleHoldEnd = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
    }
    controls.stop();
    controls.set({ pathLength: 0 });
  };

  const handleRecordingSubmit = async (text: string) => {
    if (!user) return;
    setConfessionText(text);
    setSanctuaryState('processing');
    
    try {
        const result = await processConfession({
            confessionText: text,
            model: userProfile?.preferredModel,
            language: userProfile?.preferredLanguage || i18n.language,
        });
        setForgivenessResponse(result);
        setSanctuaryState('response');
    } catch (e) {
        console.error("Error processing confession:", e);
        // Handle error state appropriately, maybe show a message and go back
        setSanctuaryState('recording');
    }
  };

  const handleReset = () => {
    setConfessionText('');
    setForgivenessResponse(null);
    setSanctuaryState('locked');
  };

  const renderCurrentStep = () => {
    switch (sanctuaryState) {
      case 'locked':
        return (
          <motion.div
            key="locked"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <h1 className="text-3xl font-bold tracking-tight">Confessionário</h1>
            <p className="mt-2 text-muted-foreground">
              Um espaço seguro para confessar seus pecados e receber a graça do perdão, conforme prometido em 1 João 1:9.
            </p>
            <div 
              className="relative w-40 h-40 mt-8 select-none cursor-pointer flex items-center justify-center"
              onMouseDown={handleHoldStart}
              onMouseUp={handleHoldEnd}
              onMouseLeave={handleHoldEnd}
              onTouchStart={handleHoldStart}
              onTouchEnd={handleHoldEnd}
            >
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary) / 0.1)" strokeWidth="5" fill="none" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="hsl(var(--primary))"
                  strokeWidth="5"
                  fill="none"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ pathLength: 0 }}
                  animate={controls}
                />
              </svg>
              <LockKeyhole className="w-24 h-24 text-primary/30" />
            </div>
            <p className="mt-4 text-sm font-semibold text-primary">Segure para entrar</p>
          </motion.div>
        );
      case 'recording':
        return <RecordingStep onSubmit={handleRecordingSubmit} />;
      case 'processing':
        return <ProcessingStep confessionText={confessionText} />;
      case 'response':
        return <ForgivenessStep response={forgivenessResponse!} onReset={handleReset} />;
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {renderCurrentStep()}
      </AnimatePresence>
    </div>
  );
}
