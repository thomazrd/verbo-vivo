"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Plan } from '@/lib/types';
import { PlanItem } from '@/components/plans/PlanItem';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

export default function PlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const q = query(collection(db, `users/${user.uid}/plans`), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userPlans: Plan[] = [];
      querySnapshot.forEach((doc) => {
        userPlans.push({ id: doc.id, ...doc.data() } as Plan);
      });
      setPlans(userPlans);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching plans: ", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight">Meus Planos de Estudo</h1>
      <p className="mt-1 text-muted-foreground">Continue sua jornada e fortaleça sua fé.</p>
      
      <div className="mt-8 space-y-4">
        {isLoading && (
          <>
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </>
        )}
        {!isLoading && plans.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhum plano de estudo encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vá para o chat, faça uma pergunta e crie um plano a partir da resposta da IA.
            </p>
          </div>
        )}
        {!isLoading && plans.map((plan) => (
          <PlanItem key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
