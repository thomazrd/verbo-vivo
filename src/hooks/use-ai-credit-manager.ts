
"use client";

import { useState } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { db } from '@/lib/firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';

export function useAiCreditManager() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);

  const withCreditCheck = <T, R>(aiFunction: (args: T) => Promise<R>): (args: T) => Promise<R | null> => {
    
    // Retorna uma nova função que envolve a lógica de verificação
    return async (args: T): Promise<R | null> => {
      if (!user || !userProfile) {
        toast({ variant: 'destructive', title: 'Não autenticado', description: 'Você precisa estar logado.' });
        return null;
      }

      // Admins têm acesso ilimitado
      const isExempt = userProfile.role === 'ADMIN';
      const hasCredits = (userProfile.aiCredits ?? 0) > 0;

      if (!isExempt && !hasCredits) {
        setIsCreditModalOpen(true);
        return null;
      }
      
      let result: R | null = null;
      try {
        // Executa a função de IA
        result = await aiFunction(args);
        
        // Debita o crédito apenas se não for admin e a função tiver sucesso
        if (!isExempt) {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("Documento do usuário não encontrado!");
                }
                const currentCredits = userDoc.data().aiCredits || 0;
                if (currentCredits <= 0) {
                     throw new Error("Créditos insuficientes para debitar.");
                }
                transaction.update(userRef, { aiCredits: increment(-1) });
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
  };

  const closeCreditModal = () => setIsCreditModalOpen(false);

  return { withCreditCheck, isCreditModalOpen, closeCreditModal };
}
