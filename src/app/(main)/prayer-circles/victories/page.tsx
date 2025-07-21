
"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { Victory } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy } from 'lucide-react';
import { VictoryCard } from '@/components/prayer/VictoryCard';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VictoryHallPage() {
  const { user } = useAuth();
  const [victories, setVictories] = useState<Victory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'victories'), orderBy('recordedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVictories: Victory[] = [];
      snapshot.forEach((doc) => {
        fetchedVictories.push({ id: doc.id, ...doc.data() } as Victory);
      });
      setVictories(fetchedVictories);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching victories:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 min-h-full">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="text-center mb-12">
          <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold tracking-tight text-amber-900">Hall da Honra</h1>
          <p className="mt-2 text-lg text-amber-700">
            Celebrando os testemunhos do poder de Deus em nosso meio.
          </p>
           <Button variant="link" asChild className="mt-2 text-amber-800">
                <Link href="/prayer-circles">Voltar aos Círculos</Link>
           </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-lg bg-amber-200/50" />
            <Skeleton className="h-40 w-full rounded-lg bg-amber-200/50" />
          </div>
        ) : victories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-amber-800">Nenhuma vitória foi registrada ainda.</p>
            <p className="text-sm text-amber-600">Continue orando, a vitória está a caminho!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {victories.map(victory => (
              <VictoryCard key={victory.id} victory={victory} currentUserId={user?.uid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
