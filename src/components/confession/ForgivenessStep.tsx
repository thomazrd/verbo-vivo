"use client";

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';
import type { ForgivenessResponse } from './ConfessionSanctuary';

interface ForgivenessStepProps {
  response: ForgivenessResponse;
  onReset: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.4,
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
      className="w-full max-w-4xl mx-auto space-y-8 text-center"
    >
      <motion.div variants={itemVariants}>
        <Sparkles className="h-16 w-16 text-amber-400 mx-auto" />
      </motion.div>
      
      <motion.p 
        variants={itemVariants} 
        className="text-2xl md:text-3xl font-serif text-muted-foreground"
      >
        {response.responseText}
      </motion.p>
      
      {response.verses.map((verse, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="bg-primary/5 border-l-4 border-primary/50 text-left p-6 rounded-lg"
        >
          <blockquote className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
            “{verse.text}”
          </blockquote>
          <p className="text-right text-lg md:text-xl text-primary/80 mt-4 font-semibold">
            — {verse.reference}
          </p>
        </motion.div>
      ))}

      <motion.div variants={itemVariants}>
        <Button size="lg" onClick={onReset}>
          <RefreshCw className="mr-2 h-5 w-5" />
          Nova Confissão
        </Button>
      </motion.div>
    </motion.div>
  );
}
