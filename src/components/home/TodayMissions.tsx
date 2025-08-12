

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import type { UserBattlePlan, BattlePlan, Mission, JournalEntry } from "@/lib/types";
import { differenceInDays, startOfDay, getDay, format } from "date-fns";
import { MissionTypeDetails } from "@/lib/mission-details";
import { ptBR } from 'date-fns/locale';

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GraduationCap, ChevronRight, Check, NotebookText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TodayMissionItem {
  type: 'BATTLE_PLAN';
  userPlanId: string;
  mission: Mission;
  planTitle: string;
  isCompleted: boolean;
}

interface JournalReminderItem {
    type: 'JOURNAL_REMINDER';
    entry: JournalEntry;
    isCompleted: boolean;
}

type TodayItem = TodayMissionItem | JournalReminderItem;


const dayMap = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

function JournalReminderCard({ item, onMarkAsRead }: { item: JournalReminderItem, onMarkAsRead: (id: string) => void }) {
    const { entry, isCompleted } = item;
    
    return (
        <div className="flex justify-between items-center p-3 rounded-md bg-background/50 border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <NotebookText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                        Lembrete: {entry.title || "Leitura do Diário"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                        {entry.content}
                    </p>
                </div>
            </div>
            {!isCompleted && (
                 <Button size="sm" variant="outline" onClick={() => onMarkAsRead(entry.id)}>
                    <Check className="mr-2 h-4 w-4" />
                    Marcar como lido
                </Button>
            )}
        </div>
    );
}

function BattlePlanMissionCard({ item }: { item: TodayMissionItem }) {
    const { userPlanId, mission, planTitle, isCompleted } = item;
    const missionPath = `/battle-plans/mission/${userPlanId}`;
    const MissionIcon = MissionTypeDetails[mission.type]?.icon;

    const MissionContent = (
       <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div>
                  <p className={`font-semibold ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>{mission.title}</p>
                  <p className="text-sm text-muted-foreground">{planTitle}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      {MissionIcon && <MissionIcon className="h-4 w-4" />}
                      <span>{MissionTypeDetails[mission.type].label}</span>
                  </div>
              </div>
          </div>
          {isCompleted ? (
              <Check className="h-5 w-5 text-green-500" />
          ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
          )}
      </div>
    );

    if (isCompleted) {
      return (
        <div className="block p-3 rounded-md bg-background/50 border opacity-70">
          {MissionContent}
        </div>
      )
    }

    return (
      <Link href={missionPath} className="block p-3 rounded-md bg-background border hover:bg-muted/50 transition-colors">
        {MissionContent}
      </Link>
    )
}


export function TodayMissions() {
  const { user } = useAuth();
  const [items, setItems] = useState<TodayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readJournalIds, setReadJournalIds] = useState<string[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const storedData = localStorage.getItem(`readJournalReminders_${user?.uid}`);
    if (storedData) {
        const parsed = JSON.parse(storedData);
        if(parsed.date === today) {
            setReadJournalIds(parsed.ids);
        } else {
             localStorage.removeItem(`readJournalReminders_${user?.uid}`);
        }
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dayOfWeek = dayMap[getDay(today)];

    const fetchAllData = async () => {
        setIsLoading(true);
        
        // Battle Plan Missions
        const userPlansQuery = query(
            collection(db, `users/${user.uid}/battlePlans`),
            where("status", "==", "IN_PROGRESS")
        );
        const battlePlanUnsub = onSnapshot(userPlansQuery, async (snapshot) => {
            const activePlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBattlePlan));
            let todayMissions: TodayMissionItem[] = [];

            for (const plan of activePlans) {
                const planStartDate = startOfDay(plan.startDate.toDate());
                const currentDayOfPlan = differenceInDays(startOfDay(today), planStartDate) + 1;

                const planDefRef = doc(db, "battlePlans", plan.planId);
                const planDefSnap = await getDoc(planDefRef);

                if (planDefSnap.exists()) {
                    const planDef = planDefSnap.data() as BattlePlan;
                    const allTodaysMissionsForPlan = planDef.missions.filter(m => m.day === currentDayOfPlan);
                    allTodaysMissionsForPlan.forEach(mission => {
                        todayMissions.push({
                            type: 'BATTLE_PLAN',
                            userPlanId: plan.id,
                            mission: mission,
                            planTitle: plan.planTitle,
                            isCompleted: plan.completedMissionIds.includes(mission.id)
                        });
                    });
                }
            }
             setItems(currentItems => [...currentItems.filter(it => it.type !== 'BATTLE_PLAN'), ...todayMissions]);
        });


        // Journal Reminders
        const journalQuery = query(
            collection(db, 'journals'),
            where('userId', '==', user.uid),
            where('reminderSchedule.isEnabled', '==', true),
            where('reminderSchedule.days', 'array-contains', dayOfWeek)
        );
        const journalUnsub = onSnapshot(journalQuery, (snapshot) => {
            const reminders: JournalReminderItem[] = [];
            const now = format(new Date(), 'HH:mm');

            snapshot.forEach(doc => {
                const entry = { id: doc.id, ...doc.data() } as JournalEntry;
                if(entry.reminderSchedule && entry.reminderSchedule.time <= now) {
                    reminders.push({
                        type: 'JOURNAL_REMINDER',
                        entry: entry,
                        isCompleted: readJournalIds.includes(entry.id),
                    })
                }
            });
             setItems(currentItems => [...currentItems.filter(it => it.type !== 'JOURNAL_REMINDER'), ...reminders]);
        });

        setIsLoading(false);
        
        return () => {
            battlePlanUnsub();
            journalUnsub();
        }
    };
    
    fetchAllData();

  }, [user, readJournalIds]);
  
  const handleMarkJournalAsRead = (entryId: string) => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const newReadIds = [...readJournalIds, entryId];
      setReadJournalIds(newReadIds);
      localStorage.setItem(`readJournalReminders_${user?.uid}`, JSON.stringify({ date: today, ids: newReadIds }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return null;
  }
  
  const sortedItems = items.sort((a,b) => (a.isCompleted ? 1 : -1) - (b.isCompleted ? 1 : -1));

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary/90 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Para Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedItems.map(item => {
           const key = item.type === 'BATTLE_PLAN' ? `${item.userPlanId}-${item.mission.id}` : item.entry.id;
           if (item.type === 'BATTLE_PLAN') {
               return <BattlePlanMissionCard key={key} item={item} />
           }
           if (item.type === 'JOURNAL_REMINDER') {
               return <JournalReminderCard key={key} item={item} onMarkAsRead={handleMarkJournalAsRead} />
           }
           return null;
        })}
      </CardContent>
    </Card>
  );
}
