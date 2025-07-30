
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { BattlePlan, UserBattlePlan } from '@/lib/types';
import { BattlePlanList } from '@/components/battle-plans/BattlePlanList';

import { Button } from '@/components/ui/button';
import { Plus, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BattlePlansPage() {
  const { user } = useAuth();
  
  const [myPlans, setMyPlans] = useState<UserBattlePlan[]>([]);
  const [publicPlans, setPublicPlans] = useState<BattlePlan[]>([]);
  const [isLoadingMyPlans, setIsLoadingMyPlans] = useState(true);
  const [isLoadingPublicPlans, setIsLoadingPublicPlans] = useState(true);

  // Fetch user's plans
  useEffect(() => {
    if (!user) {
        setIsLoadingMyPlans(false);
        return;
    };
    
    const myPlansQuery = query(collection(db, `users/${user.uid}/battlePlans`));
    const unsubscribe = onSnapshot(myPlansQuery, (snapshot) => {
        const plans: UserBattlePlan[] = [];
        snapshot.forEach(doc => {
            plans.push({ id: doc.id, ...doc.data() } as UserBattlePlan);
        });
        setMyPlans(plans);
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
       <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centro de Treinamento</h1>
          <p className="mt-1 text-muted-foreground">
            Sua armaria para as batalhas da fé.
          </p>
        </div>
        {/* Futuro Botão para Admin criar planos */}
        <Button asChild>
          <Link href="/battle-plans/create">
            <Plus className="mr-2 h-4 w-4" />
            Criar Plano
          </Link>
        </Button>
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
