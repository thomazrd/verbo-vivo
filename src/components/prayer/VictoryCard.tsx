
"use client";

import type { Victory } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ThumbsUp, Medal, Quote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface VictoryCardProps {
  victory: Victory;
  currentUserId?: string;
}

export function VictoryCard({ victory, currentUserId }: VictoryCardProps) {
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const userHasLiked = currentUserId ? victory.usersWhoSaidAmen?.includes(currentUserId) : false;

  const handleAmenClick = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    const victoryRef = doc(db, 'victories', victory.id);

    try {
      if (userHasLiked) {
        await updateDoc(victoryRef, {
          amenCount: increment(-1),
          usersWhoSaidAmen: arrayRemove(currentUserId)
        });
      } else {
        await updateDoc(victoryRef, {
          amenCount: increment(1),
          usersWhoSaidAmen: arrayUnion(currentUserId)
        });
      }
    } catch (error) {
      console.error("Error updating Amen count:", error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível registrar sua interação.'
      });
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <Card className="bg-white/60 border-amber-300 shadow-lg shadow-amber-900/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle className="text-amber-800 text-xl font-bold flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    Vitória no Círculo "{victory.circleName}"
                </CardTitle>
                <CardDescription className="text-amber-700/80">
                    Registrado por {victory.recordedByName} em {format(victory.recordedAt.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
         <blockquote className="border-l-4 border-amber-400 pl-4 py-2 my-4 bg-amber-500/10 rounded-r-lg">
            <Quote className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-amber-900 italic leading-relaxed whitespace-pre-wrap">{victory.testimony}</p>
        </blockquote>
      </CardContent>
      <CardFooter>
        <Button
          variant={userHasLiked ? 'default' : 'outline'}
          className={cn(
            'border-amber-400 text-amber-800 hover:bg-amber-100',
            userHasLiked && 'bg-amber-500 text-white hover:bg-amber-600'
          )}
          onClick={handleAmenClick}
          disabled={!currentUserId || isLiking}
        >
          <ThumbsUp className="mr-2 h-4 w-4" />
          Amém ({victory.amenCount || 0})
        </Button>
      </CardFooter>
    </Card>
  );
}
