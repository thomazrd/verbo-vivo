
"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { ForgivenessResponse } from './ConfessionSanctuary';
import { VerseCard } from '../chat/VerseCard';

interface ForgivenessStepProps {
  response: ForgivenessResponse;
  onReset: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    },
  },
};

export function ForgivenessStep({ response, onReset }: ForgivenessStepProps) {
  return (
    <motion.div
      key="response"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-2xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center">
        <Sparkles className="h-16 w-16 text-amber-400 mx-auto" />
      </motion.div>
      
      <motion.div 
        variants={itemVariants} 
        className="p-6 bg-card border rounded-lg"
      >
        <p className="whitespace-pre-wrap leading-relaxed text-card-foreground/90">{response.responseText}</p>
      </motion.div>
      
      <motion.div
        variants={itemVariants}
        className="space-y-4"
      >
        <h3 className="text-center font-semibold text-muted-foreground">Palavras de Promessa para Você:</h3>
        {response.verses.map((verse, index) => (
           <VerseCard key={index} reference={verse.reference} text={verse.text} />
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="text-center">
        <Button size="lg" onClick={onReset}>
          <RefreshCw className="mr-2 h-5 w-5" />
          Nova Confissão
        </Button>
      </motion.div>
    </motion.div>
  );
}
