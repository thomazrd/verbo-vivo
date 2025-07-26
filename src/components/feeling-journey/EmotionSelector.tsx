'use client';

import { LucideIcon, Smile, Frown, Annoyed, Angry, Meh, Hand, BrainCircuit, Heart, Zap, Sparkles, Handshake, Search, CloudSun, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export interface EmotionOption {
  name: string;
  icon: LucideIcon;
  color: string;
  type: 'positive' | 'negative';
}

export const feelingOptions: EmotionOption[] = [
  { name: 'Tristeza', icon: Frown, color: 'text-blue-500', type: 'negative' },
  { name: 'Ansiedade', icon: BrainCircuit, color: 'text-purple-500', type: 'negative' },
  { name: 'Raiva', icon: Angry, color: 'text-red-500', type: 'negative' },
  { name: 'Cansaço', icon: Zap, color: 'text-yellow-500', type: 'negative' },
  { name: 'Irritação', icon: Annoyed, color: 'text-orange-500', type: 'negative' },
  { name: 'Culpa', icon: ShieldAlert, color: 'text-gray-600', type: 'negative' },
  { name: 'Solidão', icon: CloudSun, color: 'text-indigo-400', type: 'negative' },
  { name: 'Confusão', icon: Search, color: 'text-teal-500', type: 'negative' },
];

export const positiveOptions: EmotionOption[] = [
    { name: 'Em Paz', icon: Heart, color: 'text-pink-500', type: 'positive' },
    { name: 'Esperançoso(a)', icon: Sparkles, color: 'text-cyan-500', type: 'positive' },
    { name: 'Alegria', icon: Smile, color: 'text-lime-500', type: 'positive' },
    { name: 'Gratidão', icon: Handshake, color: 'text-green-500', type: 'positive' },
]

interface EmotionSelectorProps {
  onSelectEmotion: (emotion: EmotionOption) => void;
  title: string;
}

export function EmotionSelector({ onSelectEmotion, title }: EmotionSelectorProps) {
  
  const allOptions = [...feelingOptions, ...positiveOptions];
    
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto"
    >
      <h1 className="text-3xl font-bold tracking-tight text-center mb-8">{title}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {allOptions.map((option, index) => (
          <motion.div
            key={option.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card
              className="h-full cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
              onClick={() => onSelectEmotion(option)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center">
                <option.icon className={cn("h-12 w-12 transition-colors", option.color)} />
                <span className="font-semibold text-foreground">{option.name}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
