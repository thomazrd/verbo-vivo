
"use client";

import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

interface CelebrationOverlayProps {
  onComplete: () => void;
}

export function CelebrationOverlay({ onComplete }: CelebrationOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-4"
    >
        <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { delay: 0.2, type: 'spring', stiffness: 200 } }}
        >
            <BadgeCheck className="h-24 w-24 text-green-500 mb-6" />
        </motion.div>
        <motion.h1 
            className="text-4xl font-bold text-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.4 } }}
        >
            Missão Cumprida!
        </motion.h1>
         <motion.p 
            className="text-lg text-muted-foreground mt-4 max-w-lg"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.6 } }}
        >
            Sua "Pílula de Sabedoria" foi enviada ao campo. Que ela fortaleça muitos corações.
        </motion.p>
        <motion.p 
            className="font-serif italic text-muted-foreground mt-8 text-sm"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0.8 } }}
        >
            "Aquele que supre a semente ao que semeia... fará crescer os frutos da sua justiça." - 2 Coríntios 9:10
        </motion.p>
    </motion.div>
  );
}

    