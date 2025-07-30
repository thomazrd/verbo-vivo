
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import type { BattlePlan, UserBattlePlan, Mission, MissionFeeling } from '@/lib/types';
import { differenceInDays, startOfDay } from 'date-fns';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, Shield, Handshake, Heart, BrainCircuit, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionCompletionModalProps {
  userPlanId: string;
  onClose: () => void;
}

const feelingOptions: { name: MissionFeeling, label: string, icon: React.ElementType }[] = [
    { name: 'GRATEFUL', label: 'Grato', icon: Handshake },
    { name: 'CHALLENGED', label: 'Desafiado', icon: BrainCircuit },
    { name: 'PEACEFUL', label: 'Em Paz', icon: Heart },
    { name: 'STRENGTHENED', label: 'Fortalecido', icon: Shield },
];

export function MissionCompletionModal({ userPlanId, onClose }: MissionCompletionModalProps) {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [userPlan, setUserPlan] = useState<UserBattlePlan | null>(null);
    const [planDef, setPlanDef] = useState<BattlePlan | null>(null);
    const [todaysMissions, setTodaysMissions] = useState<Mission[]>([]);
    const [missionToComplete, setMissionToComplete] = useState<Mission | null>(null);
    const [nextMission, setNextMission] = useState<Mission | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isCompleting, setIsCompleting] = useState(false);
    const [selectedFeeling, setSelectedFeeling] = useState<MissionFeeling | null>(null);

    useEffect(() => {
        if (!user) return;
        
        const fetchMissionData = async () => {
            setIsLoading(true);
            try {
                const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, userPlanId);
                const userPlanSnap = await getDoc(userPlanRef);

                if (!userPlanSnap.exists()) {
                    onClose();
                    return;
                }
                const up = { id: userPlanSnap.id, ...userPlanSnap.data() } as UserBattlePlan;
                setUserPlan(up);

                const planDefRef = doc(db, "battlePlans", up.planId);
                const planDefSnap = await getDoc(planDefRef);

                if (!planDefSnap.exists()) {
                    onClose();
                    return;
                }
                const pd = { id: planDefSnap.id, ...planDefSnap.data() } as BattlePlan;
                setPlanDef(pd);
                
                const today = startOfDay(new Date());
                const planStartDate = startOfDay(up.startDate.toDate());
                const currentDayOfPlan = differenceInDays(today, planStartDate) + 1;

                const allTodaysMissions = pd.missions.filter(m => m.day === currentDayOfPlan);
                setTodaysMissions(allTodaysMissions);

                const missionsToComplete = allTodaysMissions.filter(m => !up.completedMissionIds.includes(m.id));
                setMissionToComplete(missionsToComplete[0] || null);
                setNextMission(missionsToComplete[1] || null);
            } catch(e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissionData();
    }, [user, userPlanId, onClose]);
    
    const handleCompleteMission = async () => {
        if (!user || !userPlan || !planDef || !missionToComplete) {
            return;
        }

        if (!selectedFeeling) {
             toast({ variant: 'destructive', title: 'Atenção', description: 'Por favor, selecione como você se sentiu.' });
            return;
        }
        setIsCompleting(true);

        const newCompletedIds = [...userPlan.completedMissionIds, missionToComplete.id];
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
            missionId: missionToComplete.id,
            completedAt: new Date(),
            feeling: selectedFeeling,
        });
        
        try {
            await batch.commit();
            toast({ title: 'Missão Cumprida!', description: 'Seu progresso foi salvo.' });
            
            if (nextMission) {
                router.push(`/battle-plans/mission/${userPlanId}`);
                onClose();
            } else {
                router.push('/home'); // Go to home after the last mission of the day
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar seu progresso.' });
        } finally {
            setIsCompleting(false);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <Skeleton className="h-48 w-full" />;
        }
        
        return (
            <div className="space-y-4 pt-4">
                <p className="font-semibold">Como Deus falou com você nesta missão?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </div>
            </div>
        )
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Missão Concluída!</DialogTitle>
                </DialogHeader>
                {renderContent()}
                <DialogFooter className="mt-4">
                     <Button 
                        size="lg" 
                        onClick={handleCompleteMission}
                        disabled={isCompleting || !selectedFeeling}
                        className="w-full"
                    >
                        {isCompleting ? <Loader2 className="animate-spin mr-2"/> : (nextMission ? <ArrowRight className="mr-2"/> : <Check className="mr-2"/>)}
                        {nextMission ? "Próxima Missão" : "Concluir por Hoje"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
