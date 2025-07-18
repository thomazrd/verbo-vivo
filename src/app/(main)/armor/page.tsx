
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Armor } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Shield } from 'lucide-react';
import { ArmorCard } from '@/components/armor/ArmorCard';

export default function MyArmorPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [armors, setArmors] = useState<Armor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait until authentication status and user profile are fully loaded
    if (authLoading) {
      return;
    }

    // If loading is finished and there's no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user is loaded, but profile is not yet, wait.
    if (!userProfile) {
        // This case can happen briefly. We wait for the profile.
        // The isLoading state will show the skeleton.
        return;
    }
    
    // Redirect to onboarding if not completed
    if (!userProfile.armorOnboardingCompleted) {
      router.push('/armor/onboarding');
      return;
    }

    // At this point, user and profile are loaded, and onboarding is complete.
    // We can now safely fetch the armors.
    const q = query(collection(db, `users/${user.uid}/armors`), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userArmors: Armor[] = [];
      snapshot.forEach(doc => {
        userArmors.push({ id: doc.id, ...doc.data() } as Armor);
      });
      setArmors(userArmors);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching armors:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Arsenal</h1>
          <p className="mt-1 text-muted-foreground">
            Suas armaduras espirituais para as batalhas da vida.
          </p>
        </div>
      </div>

      {armors.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center h-[50vh]">
            <Shield className="h-16 w-16 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Nenhuma armadura forjada.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Toque no '+' para começar a se preparar para sua próxima batalha.
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {armors.map(armor => (
            <ArmorCard key={armor.id} armor={armor} />
          ))}
        </div>
      )}

      <Button asChild className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg">
          <Link href="/armor/forge">
            <Plus className="h-6 w-6" />
            <span className="sr-only">Forjar Nova Armadura</span>
          </Link>
      </Button>
    </div>
  );
}
