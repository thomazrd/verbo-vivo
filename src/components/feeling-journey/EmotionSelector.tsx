
'use client';

import { useState } from 'react';
import { LucideIcon, Smile, Frown, Annoyed, Angry, Meh, Hand, BrainCircuit, Heart, Zap, Sparkles, Handshake, Search, CloudSun, ShieldAlert, PencilLine, HandHeart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface EmotionOption {
  name: string;
  icon: LucideIcon;
  color: string;
  type: 'positive' | 'negative' | 'custom';
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
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherFeeling, setOtherFeeling] = useState('');
    
  const allOptions = [...feelingOptions, ...positiveOptions];

  const handleOtherSubmit = () => {
    if (otherFeeling.trim()) {
      onSelectEmotion({
        name: otherFeeling.trim(),
        icon: HandHeart, // Um ícone genérico para sentimentos customizados
        color: 'text-primary',
        type: 'custom',
      });
    }
  }
    
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
         <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: allOptions.length * 0.05 }}
          >
            <Card
              className="h-full cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 border-dashed"
              onClick={() => setShowOtherInput(true)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 gap-4 text-center">
                <PencilLine className="h-12 w-12 transition-colors text-muted-foreground group-hover:text-primary" />
                <span className="font-semibold text-muted-foreground group-hover:text-primary">Outro</span>
              </CardContent>
            </Card>
          </motion.div>
      </div>

       {showOtherInput && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 max-w-sm mx-auto space-y-3"
        >
          <Label htmlFor="other-feeling-input" className="font-semibold">Qual sentimento você quer registrar?</Label>
          <div className="flex gap-2">
            <Input 
              id="other-feeling-input"
              placeholder="Digite o sentimento..."
              value={otherFeeling}
              onChange={(e) => setOtherFeeling(e.target.value)}
            />
            <Button onClick={handleOtherSubmit} disabled={!otherFeeling.trim()}>Continuar</Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
