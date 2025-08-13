
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import type { MissionLog, MissionFeeling, UserBattlePlan, BattlePlan } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, CheckCircle, LineChart, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { eachDayOfInterval, format, startOfMonth, endOfMonth, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const feelingIcons: Record<MissionFeeling, React.ElementType> = {
    GRATEFUL: require('lucide-react').Handshake,
    CHALLENGED: require('lucide-react').BrainCircuit,
    PEACEFUL: require('lucide-react').Heart,
    STRENGTHENED: require('lucide-react').Shield,
    SKIPPED: require('lucide-react').SkipForward,
};


const feelingColors: Record<MissionFeeling, string> = {
  GRATEFUL: '#34D399', // green-400
  CHALLENGED: '#FBBF24', // amber-400
  PEACEFUL: '#60A5FA', // blue-400
  STRENGTHENED: '#A78BFA', // violet-400,
  SKIPPED: '#9CA3AF', // gray-400
};

const feelingLabels: Record<MissionFeeling, string> = {
    GRATEFUL: 'Grato',
    CHALLENGED: 'Desafiado',
    PEACEFUL: 'Em Paz',
    STRENGTHENED: 'Fortalecido',
    SKIPPED: 'Pulei'
};

interface EnrichedMissionLog extends MissionLog {
    missionTitle?: string;
    planTitle?: string;
}


function MissionReportSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
            </div>
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
        </div>
    )
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}

export function MissionReportClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<EnrichedMissionLog[]>([]);
  const [completedPlans, setCompletedPlans] = useState<UserBattlePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const logsQuery = query(
          collection(db, 'missionLogs'),
          where('userId', '==', user.uid),
          orderBy('completedAt', 'desc')
        );
        const logsSnapshot = await getDocs(logsQuery);
        // Os logs já contêm os títulos, então não precisamos enriquecê-los.
        const fetchedLogs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EnrichedMissionLog));
        setLogs(fetchedLogs);

        // Fetch Completed Battle Plans
        const plansQuery = query(
          collection(db, `users/${user.uid}/battlePlans`),
          where('status', '==', 'COMPLETED')
        );
        const plansSnapshot = await getDocs(plansQuery);
        const fetchedPlans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBattlePlan));
        setCompletedPlans(fetchedPlans);
      } catch (error) {
        console.error("Error fetching mission report data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  // --- Data Processing for Charts ---
  const feelingDistribution = logs.reduce((acc, log) => {
    if (log.feeling && log.feeling !== 'SKIPPED') {
      acc[log.feeling] = (acc[log.feeling] || 0) + 1;
    }
    return acc;
  }, {} as Record<MissionFeeling, number>);

  const pieChartData = Object.entries(feelingDistribution).map(([name, value]) => ({
    name: feelingLabels[name as MissionFeeling],
    value,
    fill: feelingColors[name as MissionFeeling]
  }));

  const activityDates = logs.map(log => log.completedAt.toDate());
  const currentMonth = new Date();
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  
  // Get all days in the current month
  const monthDays = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });

  // Calculate empty days to pad the beginning of the month
  const startingDayOfWeek = getDay(firstDayOfMonth); // 0 = Sunday, 1 = Monday...
  const emptyDays = Array.from({ length: startingDayOfWeek });


  const totalMissions = logs.length;
  
  if (isLoading) {
    return (
        <div className="container mx-auto max-w-4xl py-8 px-4">
             <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Diário de Batalha</h1>
                    <p className="text-muted-foreground">Seu progresso e insights no campo de treinamento.</p>
                </div>
            </div>
            <MissionReportSkeleton />
        </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Diário de Batalha</h1>
            <p className="text-muted-foreground">Seu progresso e insights no campo de treinamento.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Missões Cumpridas" value={totalMissions} icon={Target} />
            <StatCard title="Planos Concluídos" value={completedPlans.length} icon={Trophy} />
            <StatCard title="Sentimento Comum" value={pieChartData[0]?.name || '-'} icon={LineChart} />
        </div>

        {/* Feelings Chart */}
        <Card>
            <CardHeader><CardTitle>Análise de Sentimentos</CardTitle></CardHeader>
            <CardContent>
                {pieChartData.length > 0 ? (
                    <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} missões`, name]}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ): (
                    <p className="text-center text-sm text-muted-foreground py-8">Complete missões para ver a análise de seus sentimentos.</p>
                )}
            </CardContent>
        </Card>

        {/* Activity Calendar */}
        <Card>
            <CardHeader><CardTitle>Calendário de Atividade ({format(currentMonth, 'MMMM', { locale: ptBR })})</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground font-semibold">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                 <div className="grid grid-cols-7 gap-1 mt-2">
                    {emptyDays.map((_, index) => (
                        <div key={`empty-${index}`} />
                    ))}
                    {monthDays.map((day) => {
                        const dayHasActivity = activityDates.some(ad => isSameDay(ad, day));
                        return (
                            <div
                                key={day.toString()}
                                className={cn("w-full aspect-square rounded flex items-center justify-center text-xs", 
                                    dayHasActivity ? 'bg-primary/80 text-primary-foreground' : 'bg-muted/50'
                                )}
                                title={dayHasActivity ? 'Missão concluída!' : ''}
                            >
                                {format(day, 'd')}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
        
        {/* Mission History */}
        <Card>
            <CardHeader>
                <CardTitle>Histórico de Missões</CardTitle>
                <CardDescription>Revise suas missões concluídas e os sentimentos registrados.</CardDescription>
            </CardHeader>
            <CardContent>
                {logs.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {logs.map(log => {
                            const FeelingIcon = feelingIcons[log.feeling] || CheckCircle;
                            return (
                                <li key={log.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-md">
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{log.missionTitle || "Missão desconhecida"}</p>
                                        <p className="text-xs text-muted-foreground">{log.planTitle || "Plano desconhecido"}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{format(log.completedAt.toDate(), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: feelingColors[log.feeling] }}>
                                        <FeelingIcon className="h-4 w-4" />
                                        <span>{feelingLabels[log.feeling]}</span>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                     <p className="text-center text-sm text-muted-foreground py-8">Nenhuma missão concluída ainda. Inicie um plano e complete uma missão!</p>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Hall da Honra: Planos Concluídos</CardTitle></CardHeader>
            <CardContent>
                {completedPlans.length > 0 ? (
                    <ul className="space-y-2">
                        {completedPlans.map(plan => (
                            <li key={plan.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                                <CheckCircle className="h-5 w-5 text-green-500"/>
                                <span className="font-semibold">{plan.planTitle}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-center text-sm text-muted-foreground py-8">Nenhum plano de batalha concluído ainda. Continue firme!</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
