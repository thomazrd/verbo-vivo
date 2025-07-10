"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import type { Plan } from '@/lib/types';
import { PlanDetailClient } from '@/components/plans/PlanDetailClient';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlanDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const planId = params.planId as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !planId) return;

    const docRef = doc(db, `users/${user.uid}/plans`, planId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setPlan({ id: docSnap.id, ...docSnap.data() } as Plan);
        setError(null);
      } else {
        setError("Plano não encontrado.");
        setPlan(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching plan details:", err);
      setError("Falha ao carregar o plano.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, planId]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4 pt-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-3xl py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
      </div>
    );
  }

  return plan ? <PlanDetailClient planData={plan} /> : null;
}
