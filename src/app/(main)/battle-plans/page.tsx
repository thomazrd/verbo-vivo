
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
  
  const [myPlans, setMyPlans] = useState<UserBattlePlan[]>([]);
  const [publicPlans, setPublicPlans] = useState<BattlePlan[]>([]);
  const [isLoadingMyPlans, setIsLoadingMyPlans] = useState(true);
  const [isLoadingPublicPlans, setIsLoadingPublicPlans] = useState(true);

  // Fetch user's enrolled plans
  useEffect(() => {
    if (!user) {
        setIsLoadingMyPlans(false);
        return;
    };
    
    setIsLoadingMyPlans(true);
    const userBattlePlansQuery = query(collection(db, `users/${user.uid}/battlePlans`));
    
    const unsubscribe = onSnapshot(userBattlePlansQuery, (snapshot) => {
        const startedPlans: UserBattlePlan[] = [];
        snapshot.forEach(doc => {
            startedPlans.push({ id: doc.id, ...doc.data() } as UserBattlePlan);
        });

        // Sort: In-progress plans first, then by creation/start date
        startedPlans.sort((a, b) => {
            const aInProgress = a.status === 'IN_PROGRESS';
            const bInProgress = b.status === 'IN_PROGRESS';
            if (aInProgress && !bInProgress) return -1;
            if (!aInProgress && bInProgress) return 1;
            return (b.startDate?.toMillis() || 0) - (a.startDate?.toMillis() || 0);
        });

        setMyPlans(startedPlans);
        setIsLoadingMyPlans(false);
    }, (error) => {
        console.error("Error fetching user's battle plans:", error);
        setIsLoadingMyPlans(false);
    });

    return () => unsubscribe();
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
