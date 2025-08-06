
'use client';

import { Button } from '@/components/ui/button';
import { BadgeCheck, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface JourneyConclusionProps {
  initialEmotion?: string;
  finalEmotion?: string;
  onReset: () => void;
  wasStopped?: boolean;
}

export function JourneyConclusion({ initialEmotion, finalEmotion, onReset, wasStopped = false }: JourneyConclusionProps) {
    
  const getMessage = () => {
    if (wasStopped) {
        return {
            title: "Jornada Interrompida",
            description: "Você deu um passo importante. Lembre-se que você pode retornar a qualquer momento para continuar cuidando do seu coração.",
            icon: XCircle,
            color: "text-amber-500"
        }
    }
    return {
        title: "Jornada Concluída!",
        description: `Parabéns por cuidar do seu coração. Você começou sentindo "${initialEmotion}" e terminou em um lugar de "${finalEmotion}". Que a paz de Deus continue com você.`,
        icon: BadgeCheck,
        color: "text-green-500"
    }
  }

  const { title, description, icon: Icon, color } = getMessage();

  return (
    <motion.div
      key="conclusion"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
      className="text-center p-8 max-w-lg mx-auto bg-card border rounded-lg shadow-lg"
    >
      <Icon className={`h-16 w-16 mx-auto mb-4 ${color}`} />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
      <Button size="lg" className="mt-8" onClick={onReset}>
        Iniciar Nova Jornada
      </Button>
    </motion.div>
  );
}
