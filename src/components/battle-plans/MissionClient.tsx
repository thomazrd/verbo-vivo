
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { BattlePlan, Mission, UserBattlePlan, MissionFeeling } from "@/lib/types";
import { differenceInDays, startOfDay } from "date-fns";
import { Loader2, Check, Shield, Handshake, Heart, BrainCircuit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { bibleBooksByAbbrev } from "@/lib/bible-books-by-abbrev";


export function MissionClient({ userPlanId }: { userPlanId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [userPlan, setUserPlan] = useState<UserBattlePlan | null>(null);
    const [planDef, setPlanDef] = useState<BattlePlan | null>(null);
    const [mission, setMission] = useState<Mission | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        
        const fetchMissionData = async () => {
            setIsLoading(true);
            try {
                const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, userPlanId);
                const userPlanSnap = await getDoc(userPlanRef);

                if (!userPlanSnap.exists()) {
                    toast({ variant: 'destructive', title: 'Erro', description: 'Progresso do plano não encontrado.'});
                    router.push('/battle-plans');
                    return;
                }
                const up = { id: userPlanSnap.id, ...userPlanSnap.data() } as UserBattlePlan;
                setUserPlan(up);

                const planDefRef = doc(db, "battlePlans", up.planId);
                const planDefSnap = await getDoc(planDefRef);

                if (!planDefSnap.exists()) {
                     toast({ variant: 'destructive', title: 'Erro', description: 'Definição do plano não encontrada.'});
                    router.push('/battle-plans');
                    return;
                }
                const pd = { id: planDefSnap.id, ...planDefSnap.data() } as BattlePlan;
                setPlanDef(pd);
                
                const today = startOfDay(new Date());
                const planStartDate = startOfDay(up.startDate.toDate());
                const currentDayOfPlan = differenceInDays(today, planStartDate) + 1;

                const todaysMission = pd.missions
                  .filter(m => m.day === currentDayOfPlan)
                  .find(m => !up.completedMissionIds.includes(m.id));

                setMission(todaysMission || null);
            } catch(e) {
                console.error(e);
                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os dados da missão.'});
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissionData();
    }, [user, userPlanId, router, toast]);

    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl py-8 px-4 animate-pulse">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2 mb-8" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-12 w-full mt-8" />
            </div>
        );
    }
    
    if (!mission) {
         return (
            <div className="container mx-auto max-w-2xl py-8 px-4 text-center">
                <Check className="h-12 w-12 text-green-500 mx-auto" />
                <h1 className="text-2xl font-bold mt-4">Missões do dia concluídas!</h1>
                <p className="text-muted-foreground mt-2">Volte amanhã para seu próximo desafio.</p>
                <Button onClick={() => router.push('/home')} className="mt-6">Voltar para a Home</Button>
            </div>
        )
    }

    let missionPath = mission.content.path;
    const completionParam = mission.content.completionQueryParam;
    
    if (mission.type === 'BIBLE_READING' && mission.content.verse) {
        const refMatch = mission.content.verse.match(/^(.*?)\s(\d+):?(\d+)?-?(\d+)?$/);
        if (refMatch) {
            const [, bookName, chapter] = refMatch;
            const bookAbbrev = Object.values(bibleBooksByAbbrev).find(b => b.name === bookName)?.abbrev.pt;
            if(bookAbbrev && chapter) {
                missionPath = `/bible?book=${bookAbbrev}&chapter=${chapter}&userPlanId=${userPlanId}`;
            }
        }
    } else if (completionParam) {
        if (completionParam === 'mission') {
             missionPath = `${mission.content.path}?mission=true&userPlanId=${userPlanId}`;
        } else {
            const paramKey = completionParam;
            const paramValue = userPlanId;
            missionPath = `${mission.content.path}?${paramKey}=${paramValue}`;
        }
    }


    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <p className="text-sm font-semibold text-primary">{planDef?.title}</p>
            <h1 className="text-3xl font-bold tracking-tight mt-1">Missão do Dia {mission.day}</h1>
            
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>{mission.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    {mission.type === 'BIBLE_READING' && (
                        <p className="text-lg">Leia e medite em: <strong className="font-mono">{mission.content.verse}</strong></p>
                    )}
                    {mission.leaderNote && (
                        <blockquote className="mt-4 border-l-2 pl-4 italic text-muted-foreground">
                            <strong>Nota do Líder:</strong> {mission.leaderNote}
                        </blockquote>
                    )}
                </CardContent>
            </Card>
            
            <div className="mt-8 flex justify-end">
                 <Button size="lg" asChild>
                    <Link href={missionPath}>
                        Ir para a Missão
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
