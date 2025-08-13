
"use client";

import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export function useAiCreditManager() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  const withCreditCheck = async <T, R>(aiFunction: (args: T) => Promise<R>): Promise<(args: T) => Promise<R | null>> => {
    
    const wrappedFunction = async (args: T): Promise<R | null> => {
      if (!user || !userProfile) {
        toast({ variant: 'destructive', title: 'Não autenticado', description: 'Você precisa estar logado.' });
        return null;
      }

      // Allow admins to bypass credit checks
      if (userProfile.role !== 'ADMIN' && (userProfile.aiCredits === undefined || userProfile.aiCredits <= 0)) {
        setIsCreditModalOpen(true);
        return null;
      }
      
      let result: R | null = null;
      try {
        result = await aiFunction(args);
        
        // Only debit credit if the user is not an admin
        if (userProfile.role !== 'ADMIN') {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw "Documento do usuário não encontrado!";
                }
                const newCredits = (userDoc.data().aiCredits || 0) - 1;
                if (newCredits < 0) {
                    throw "Créditos já esgotados.";
                }
                transaction.update(userRef, { aiCredits: newCredits });
            });
        }

      } catch (error) {
        console.error("AI function or credit debit failed:", error);
        toast({
          variant: "destructive",
          title: "Erro na Operação de IA",
          description: "Não foi possível completar a ação. Nenhum crédito foi debitado.",
        });
        return null; 
      }

      return result;
    };

    return wrappedFunction;
  };

  const closeCreditModal = () => setIsCreditModalOpen(false);

  return { withCreditCheck, isCreditModalOpen, closeCreditModal };
}
