"use client";

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProcessingStepProps {
  confessionText: string;
}

export function ProcessingStep({ confessionText }: ProcessingStepProps) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-6 w-full max-w-2xl"
    >
      {confessionText && (
        <div className="p-4 rounded-lg bg-muted/50 w-full animate-in fade-in-0">
          <p className="text-sm text-center italic text-muted-foreground line-clamp-3">
            Sua confissão: "{confessionText}"
          </p>
        </div>
      )}
      <Loader2 className="h-16 w-16 text-primary animate-spin" />
      <p className="text-xl text-muted-foreground text-center">Processando sua confissão à luz da graça...</p>
    </motion.div>
  );
}
