
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import type { UserBattlePlan, BattlePlan, Mission } from "@/lib/types";
import { differenceInDays, startOfDay } from "date-fns";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GraduationCap, ChevronRight, Check } from "lucide-react";

interface TodayMissionItem {
  userPlanId: string;
  mission: Mission;
  planTitle: string;
}

export function TodayMissions() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<TodayMissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const userPlansQuery = query(
      collection(db, `users/${user.uid}/battlePlans`),
      where("status", "==", "IN_PROGRESS")
    );

    const unsubscribe = onSnapshot(userPlansQuery, async (snapshot) => {
      const activePlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserBattlePlan));
      const today = startOfDay(new Date());
      const todayMissions: TodayMissionItem[] = [];

      for (const plan of activePlans) {
        const planStartDate = startOfDay(plan.startDate.toDate());
        const currentDayOfPlan = differenceInDays(today, planStartDate) + 1;

        // Fetch the full BattlePlan to get mission details
        const planDefRef = doc(db, "battlePlans", plan.planId);
        const planDefSnap = await getDoc(planDefRef);

        if (planDefSnap.exists()) {
          const planDef = planDefSnap.data() as BattlePlan;
          const todaysMission = planDef.missions.find(m => m.day === currentDayOfPlan);

          if (todaysMission && !plan.completedMissionIds.includes(todaysMission.id)) {
            todayMissions.push({
              userPlanId: plan.id,
              mission: todaysMission,
              planTitle: plan.planTitle,
            });
          }
        }
      }

      setMissions(todayMissions);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  if (missions.length === 0) {
    return null; // Don't render anything if there are no missions for today
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary/90 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Suas Missões de Hoje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.map(({ userPlanId, mission, planTitle }) => {
          let missionPath = mission.content.path;
           if (mission.type === 'JOURNAL_ENTRY') {
              missionPath = `${mission.content.path}?mission=true&userPlanId=${userPlanId}`;
          } else if (mission.content.path.startsWith('/')) {
              missionPath = `${mission.content.path}?missionId=${userPlanId}`;
          }
          
          return (
            <Link
              href={missionPath}
              key={mission.id}
              className="block p-3 rounded-md bg-background border hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-center">
                  <div>
                      <p className="font-semibold">{mission.title}</p>
                      <p className="text-sm text-muted-foreground">{planTitle}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  );
}
