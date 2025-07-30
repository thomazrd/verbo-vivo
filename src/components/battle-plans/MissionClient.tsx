"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, writeBatch, collection } from "firebase/firestore";
import type { BattlePlan, Mission, UserBattlePlan, MissionFeeling } from "@/lib/types";
import { differenceInDays, startOfDay } from "date-fns";
import { Loader2, Check, Shield, Handshake, Heart, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const feelingOptions: { name: MissionFeeling, label: string, icon: React.ElementType }[] = [
    { name: 'GRATEFUL', label: 'Grato', icon: Handshake },
    { name: 'CHALLENGED', label: 'Desafiado', icon: BrainCircuit },
    { name: 'PEACEFUL', label: 'Em Paz', icon: Heart },
    { name: 'STRENGTHENED', label: 'Fortalecido', icon: Shield },
];

export function MissionClient({ userPlanId }: { userPlanId: string }) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [userPlan, setUserPlan] = useState<UserBattlePlan | null>(null);
    const [planDef, setPlanDef] = useState<BattlePlan | null>(null);
    const [mission, setMission] = useState<Mission | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [selectedFeeling, setSelectedFeeling] = useState<MissionFeeling | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const fetchMissionData = async () => {
            setIsLoading(true);
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

            const todaysMission = pd.missions.find(m => m.day === currentDayOfPlan);
            setMission(todaysMission || null);
            setIsLoading(false);
        };

        fetchMissionData();
    }, [user, userPlanId, router, toast]);

    const handleCompleteMission = async () => {
        if (!user || !userPlan || !planDef || !mission || !selectedFeeling) {
             toast({ variant: 'destructive', title: 'Atenção', description: 'Por favor, selecione como você se sentiu.' });
            return;
        }
        setIsCompleting(true);

        const newCompletedIds = [...userPlan.completedMissionIds, mission.id];
        const newProgress = (newCompletedIds.length / planDef.missions.length) * 100;

        const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, userPlan.id);
        const missionLogRef = doc(collection(db, "missionLogs"));
        
        const batch = writeBatch(db);

        batch.update(userPlanRef, {
            completedMissionIds: newCompletedIds,
            progressPercentage: newProgress,
            status: newProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
        });
        
        batch.set(missionLogRef, {
            userId: user.uid,
            planId: planDef.id,
            missionId: mission.id,
            completedAt: new Date(),
            feeling: selectedFeeling,
        });
        
        try {
            await batch.commit();
            toast({ title: 'Missão Cumprida!', description: 'Seu progresso foi salvo.' });
            router.push('/home');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu progresso.' });
            setIsCompleting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="container mx-auto max-w-2xl py-8 px-4 animate-pulse">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2 mb-8" />
                <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
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
                     {mission.type === 'PRAYER' && (
                        <p className="text-lg">{"mission.content.prompt"}</p>
                    )}
                    {mission.leaderNote && (
                        <blockquote className="mt-4 border-l-2 pl-4 italic text-muted-foreground">
                            <strong>Nota do Líder:</strong> {mission.leaderNote}
                        </blockquote>
                    )}
                </CardContent>
            </Card>

            <Card className="mt-6">
                 <CardHeader>
                    <CardTitle className="text-xl">Como Deus falou com você nesta missão?</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {feelingOptions.map(option => {
                        const Icon = option.icon;
                        return (
                             <Button 
                                key={option.name}
                                variant={selectedFeeling === option.name ? "default" : "outline"}
                                className="h-auto py-3 flex-col gap-2"
                                onClick={() => setSelectedFeeling(option.name)}
                            >
                                <Icon className="h-6 w-6" />
                                <span className="font-semibold">{option.label}</span>
                            </Button>
                        )
                    })}
                </CardContent>
            </Card>
            
            <div className="mt-8 flex justify-end">
                <Button size="lg" onClick={handleCompleteMission} disabled={isCompleting || !selectedFeeling}>
                    {isCompleting ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                    Concluir Missão
                </Button>
            </div>
        </div>
    );
}
