
"use client";

import { useState } from 'react';
import type { Study } from '@/lib/types';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Heart, Lightbulb, Hand, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface ReactionButtonsProps {
  study: Study;
  user: User | null;
}

const reactionTypes = [
  { id: 'pray', icon: Hand, label: 'Orei' },
  { id: 'love', icon: Heart, label: 'Amei' },
  { id: 'insightful', icon: Lightbulb, label: 'Esclarecedor' },
  { id: 'thinking', icon: MessageCircle, label: 'Para Refletir' },
];

export function ReactionButtons({ study, user }: ReactionButtonsProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  const handleReaction = async (reactionId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Acesso Negado',
        description: 'Você precisa fazer login para reagir.',
      });
      return;
    }
    setIsSubmitting(reactionId);
    
    const studyRef = doc(db, 'studies', study.id);

    try {
      await runTransaction(db, async (transaction) => {
        const studyDoc = await transaction.get(studyRef);
        if (!studyDoc.exists()) {
          throw new Error("Estudo não encontrado!");
        }

        const data = studyDoc.data();
        const currentReactions = data.reactions || {};
        
        // Remove user from any other reaction they might have
        for (const key in currentReactions) {
          if (key !== reactionId) {
            const userIndex = (currentReactions[key] || []).indexOf(user.uid);
            if (userIndex > -1) {
              currentReactions[key].splice(userIndex, 1);
            }
          }
        }
        
        // Add or remove user from the clicked reaction
        const reactionList = currentReactions[reactionId] || [];
        const userIndex = reactionList.indexOf(user.uid);
        
        if (userIndex > -1) {
          // User is removing their reaction
          reactionList.splice(userIndex, 1);
        } else {
          // User is adding a reaction
          reactionList.push(user.uid);
        }

        currentReactions[reactionId] = reactionList;
        transaction.update(studyRef, { reactions: currentReactions });
      });

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar sua reação.' });
    } finally {
      setIsSubmitting(null);
    }
  };


  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border bg-card p-4">
      {reactionTypes.map((reaction) => {
        const Icon = reaction.icon;
        const count = study.reactions?.[reaction.id]?.length || 0;
        const userHasReacted = user ? study.reactions?.[reaction.id]?.includes(user.uid) : false;

        return (
          <Button
            key={reaction.id}
            variant={userHasReacted ? 'secondary' : 'ghost'}
            className={cn(
              'h-auto px-3 py-2 flex-col gap-1 text-xs sm:flex-row sm:text-sm',
              userHasReacted && 'border-primary/50 text-primary'
            )}
            onClick={() => handleReaction(reaction.id)}
            disabled={!!isSubmitting}
          >
            {isSubmitting === reaction.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className={cn("h-4 w-4", userHasReacted && "fill-current")} />
            )}
            <span>{reaction.label}</span>
            {count > 0 && <span className="font-bold">{count}</span>}
          </Button>
        );
      })}
    </div>
  );
}
