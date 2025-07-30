
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
    
    // For BIBLE_READING, we need to construct the URL differently.
    if (mission.type === 'BIBLE_READING' && mission.content.verse) {
        // Example verse: "Gênesis 1:1-5"
        const refMatch = mission.content.verse.match(/^(.*?)\s(\d+):?(\d+)?-?(\d+)?$/);
        if (refMatch) {
            const [, bookName, chapter] = refMatch;
            const bookAbbrev = Object.values(bibleBooksByAbbrev).find(b => b.name === bookName)?.abbrev.pt;
            if(bookAbbrev && chapter) {
                missionPath = `/bible?book=${bookAbbrev}&chapter=${chapter}&userPlanId=${userPlanId}`;
            }
        }
    } else if (completionParam) {
        const paramValue = completionParam === 'mission' ? 'true' : userPlanId;
        const paramKey = completionParam === 'mission' ? 'mission' : 'userPlanId';
        missionPath = `${mission.content.path}?${paramKey}=${paramValue}`;
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

// Minimal map to resolve book names to abbrevs for URL construction
const bibleBooksByAbbrev: { [key: string]: { name: string, abbrev: { pt: string } } } = {
  gn: { name: 'Gênesis', abbrev: { pt: 'gn' } },
  ex: { name: 'Êxodo', abbrev: { pt: 'ex' } },
  lv: { name: 'Levítico', abbrev: { pt: 'lv' } },
  nm: { name: 'Números', abbrev: { pt: 'nm' } },
  dt: { name: 'Deuteronômio', abbrev: { pt: 'dt' } },
  js: { name: 'Josué', abbrev: { pt: 'js' } },
  jz: { name: 'Juízes', abbrev: { pt: 'jz' } },
  rt: { name: 'Rute', abbrev: { pt: 'rt' } },
  '1sm': { name: '1º Samuel', abbrev: { pt: '1sm' } },
  '2sm': { name: '2º Samuel', abbrev: { pt: '2sm' } },
  '1rs': { name: '1º Reis', abbrev: { pt: '1rs' } },
  '2rs': { name: '2º Reis', abbrev: { pt: '2rs' } },
  '1cr': { name: '1º Crônicas', abbrev: { pt: '1cr' } },
  '2cr': { name: '2º Crônicas', abbrev: { pt: '2cr' } },
  ed: { name: 'Esdras', abbrev: { pt: 'ed' } },
  ne: { name: 'Neemias', abbrev: { pt: 'ne' } },
  et: { name: 'Ester', abbrev: { pt: 'et' } },
  job: { name: 'Jó', abbrev: { pt: 'job' } },
  sl: { name: 'Salmos', abbrev: { pt: 'sl' } },
  pv: { name: 'Provérbios', abbrev: { pt: 'pv' } },
  ec: { name: 'Eclesiastes', abbrev: { pt: 'ec' } },
  ct: { name: 'Cânticos', abbrev: { pt: 'ct' } },
  is: { name: 'Isaías', abbrev: { pt: 'is' } },
  jr: { name: 'Jeremias', abbrev: { pt: 'jr' } },
  lm: { name: 'Lamentações', abbrev: { pt: 'lm' } },
  ez: { name: 'Ezequiel', abbrev: { pt: 'ez' } },
  dn: { name: 'Daniel', abbrev: { pt: 'dn' } },
  os: { name: 'Oséias', abbrev: { pt: 'os' } },
  jl: { name: 'Joel', abbrev: { pt: 'jl' } },
  am: { name: 'Amós', abbrev: { pt: 'am' } },
  ob: { name: 'Obadias', abbrev: { pt: 'ob' } },
  jn: { name: 'Jonas', abbrev: { pt: 'jn' } },
  mq: { name: 'Miquéias', abbrev: { pt: 'mq' } },
  na: { name: 'Naum', abbrev: { pt: 'na' } },
  hc: { name: 'Habacuque', abbrev: { pt: 'hc' } },
  sf: { name: 'Sofonias', abbrev: { pt: 'sf' } },
  ag: { name: 'Ageu', abbrev: { pt: 'ag' } },
  zc: { name: 'Zacarias', abbrev: { pt: 'zc' } },
  ml: { name: 'Malaquias', abbrev: { pt: 'ml' } },
  mt: { name: 'Mateus', abbrev: { pt: 'mt' } },
  mc: { name: 'Marcos', abbrev: { pt: 'mc' } },
  lc: { name: 'Lucas', abbrev: { pt: 'lc' } },
  jo: { name: 'João', abbrev: { pt: 'jo' } },
  at: { name: 'Atos', abbrev: { pt: 'at' } },
  rm: { name: 'Romanos', abbrev: { pt: 'rm' } },
  '1co': { name: '1ª Coríntios', abbrev: { pt: '1co' } },
  '2co': { name: '2ª Coríntios', abbrev: { pt: '2co' } },
  gl: { name: 'Gálatas', abbrev: { pt: 'gl' } },
  ef: { name: 'Efésios', abbrev: { pt: 'ef' } },
  fp: { name: 'Filipenses', abbrev: { pt: 'fp' } },
  cl: { name: 'Colossenses', abbrev: { pt: 'cl' } },
  '1ts': { name: '1ª Tessalonicenses', abbrev: { pt: '1ts' } },
  '2ts': { name: '2ª Tessalonicenses', abbrev: { pt: '2ts' } },
  '1tm': { name: '1ª Timóteo', abbrev: { pt: '1tm' } },
  '2tm': { name: '2ª Timóteo', abbrev: { pt: '2tm' } },
  tt: { name: 'Tito', abbrev: { pt: 'tt' } },
  fm: { name: 'Filemom', abbrev: { pt: 'fm' } },
  hb: { name: 'Hebreus', abbrev: { pt: 'hb' } },
  tg: { name: 'Tiago', abbrev: { pt: 'tg' } },
  '1pe': { name: '1ª Pedro', abbrev: { pt: '1pe' } },
  '2pe': { name: '2ª Pedro', abbrev: { pt: '2pe' } },
  '1jo': { name: '1ª João', abbrev: { pt: '1jo' } },
  '2jo': { name: '2ª João', abbrev: { pt: '2jo' } },
  '3jo': { name: '3ª João', abbrev: { pt: '3jo' } },
  jd: { name: 'Judas', abbrev: { pt: 'jd' } },
  ap: { name: 'Apocalipse', abbrev: { pt: 'ap' } },
};
