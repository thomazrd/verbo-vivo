
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import type { BattlePlan, UserBattlePlan } from '@/lib/types';
import { BattlePlanList } from '@/components/battle-plans/BattlePlanList';

import { Button } from '@/components/ui/button';
import { Plus, NotebookPen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BattlePlansPage() {
  const { user } = useAuth();
  
  const [myPlans, setMyPlans] = useState<(UserBattlePlan | BattlePlan)[]>([]);
  const [publicPlans, setPublicPlans] = useState<BattlePlan[]>([]);
  const [isLoadingMyPlans, setIsLoadingMyPlans] = useState(true);
  const [isLoadingPublicPlans, setIsLoadingPublicPlans] = useState(true);

  // Fetch user's plans (both in-progress and created by them)
  useEffect(() => {
    if (!user) {
        setIsLoadingMyPlans(false);
        return;
    };
    
    const fetchMyPlans = async () => {
        setIsLoadingMyPlans(true);
        
        // Plans the user has started
        const userBattlePlansQuery = query(collection(db, `users/${user.uid}/battlePlans`));
        const userBattlePlansSnap = await getDocs(userBattlePlansQuery);
        const startedPlans = userBattlePlansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBattlePlan));

        // Plans created by the user
        const createdByMeQuery = query(collection(db, "battlePlans"), where("creatorId", "==", user.uid));
        const createdByMeSnap = await getDocs(createdByMeQuery);
        const createdPlans = createdByMeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BattlePlan));
        
        // Combine and deduplicate. A user can have started a plan they created.
        const combined = [...startedPlans];
        createdPlans.forEach(createdPlan => {
            // A plan is identified by its original ID. For user plans, it's `planId`.
            if (!combined.some(p => (p as UserBattlePlan).planId === createdPlan.id)) {
                combined.push(createdPlan);
            }
        });

        // Sort: In-progress plans first, then by creation/start date
        combined.sort((a, b) => {
            const aIsUserPlan = 'progressPercentage' in a;
            const bIsUserPlan = 'progressPercentage' in b;
            if (aIsUserPlan && !bIsUserPlan) return -1;
            if (!aIsUserPlan && bIsUserPlan) return 1;
            return 0; // Further sorting could be added if needed
        });

        setMyPlans(combined);
        setIsLoadingMyPlans(false);
    }

    fetchMyPlans();
    
    // We can use a listener here if we want real-time updates for myPlans,
    // but a one-time fetch is often sufficient for this kind of view.
    // For simplicity, I'll stick to the one-time fetch.

  }, [user]);

  // Fetch public plans to explore
  useEffect(() => {
    const publicPlansQuery = query(
        collection(db, "battlePlans"),
        where("status", "==", "PUBLISHED")
    );
    const unsubscribe = onSnapshot(publicPlansQuery, (snapshot) => {
        const plans: BattlePlan[] = [];
        snapshot.forEach(doc => {
            plans.push({ id: doc.id, ...doc.data() } as BattlePlan);
        });
        setPublicPlans(plans);
        setIsLoadingPublicPlans(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4 h-full flex flex-col">
       <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Treinamento</h1>
          <p className="mt-1 text-muted-foreground">
            Sua armaria para as batalhas da fé.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/battle-plans/report">
                    <NotebookPen className="mr-2 h-4 w-4" />
                    Diário de Batalha
                </Link>
            </Button>
            <Button asChild>
                <Link href="/battle-plans/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Plano
                </Link>
            </Button>
        </div>
      </div>

       <Tabs defaultValue="my-plans">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-plans">Meus Planos</TabsTrigger>
          <TabsTrigger value="explore">Explorar</TabsTrigger>
        </TabsList>
        <TabsContent value="my-plans" className="mt-6">
            <BattlePlanList
                plans={myPlans}
                isLoading={isLoadingMyPlans}
                isUserPlans={true}
            />
        </TabsContent>
        <TabsContent value="explore" className="mt-6">
            <BattlePlanList
                plans={publicPlans}
                isLoading={isLoadingPublicPlans}
                isUserPlans={false}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
