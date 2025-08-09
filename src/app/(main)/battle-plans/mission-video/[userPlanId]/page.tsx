
"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { BattlePlan, Mission, UserBattlePlan } from '@/lib/types';
import { Loader2, CheckCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { MissionCompletionModal } from '@/components/battle-plans/MissionCompletionModal';
import { Button } from '@/components/ui/button';
import { CustomYoutubePlayer } from '@/components/common/CustomYoutubePlayer';

function getYoutubeVideoId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}


function VideoMissionPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const userPlanId = params.userPlanId as string;
  const missionId = searchParams.get('missionId');

  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [canComplete, setCanComplete] = useState(false);


  useEffect(() => {
    if (!user || !userPlanId || !missionId) {
      setError("Informações da missão ausentes.");
      setIsLoading(false);
      return;
    }

    const fetchMission = async () => {
      try {
        const userPlanRef = doc(db, `users/${user.uid}/battlePlans`, userPlanId);
        const userPlanSnap = await getDoc(userPlanRef);
        if (!userPlanSnap.exists()) throw new Error("Plano de usuário não encontrado.");

        const planDefRef = doc(db, 'battlePlans', userPlanSnap.data().planId);
        const planDefSnap = await getDoc(planDefRef);
        if (!planDefSnap.exists()) throw new Error("Definição do plano não encontrada.");
        
        const planDef = planDefSnap.data() as BattlePlan;
        const missionData = planDef.missions.find(m => m.id === missionId);

        if (!missionData) throw new Error("Missão não encontrada no plano.");
        setMission(missionData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMission();
  }, [user, userPlanId, missionId]);

  const handleModalClose = () => {
    router.push('/home'); // Or back to battle plans
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !mission || !mission.content.verse) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-destructive p-4 text-center">
        <p>Erro ao carregar a missão: {error || "URL do vídeo não encontrada."}</p>
        <Button variant="link" onClick={() => router.push('/home')}>Voltar para Home</Button>
      </div>
    );
  }
  
  const videoId = getYoutubeVideoId(mission.content.verse);
  if (!videoId) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background text-destructive p-4 text-center">
            <p>URL do YouTube inválida.</p>
            <Button variant="link" onClick={() => router.push('/home')}>Voltar para Home</Button>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-0 md:p-4">
        <div className="w-full max-w-4xl space-y-2">
             <div className="text-foreground bg-background/50 p-2 md:rounded-t-lg">
                <h1 className="font-bold text-lg">{mission.title}</h1>
            </div>
            
            <CustomYoutubePlayer 
                videoId={videoId} 
                onProgress={(progress, duration) => {
                    if (duration > 0 && progress / duration >= 0.8) {
                        setCanComplete(true);
                    }
                }}
                onVideoEnd={() => {
                    setCanComplete(true);
                    setMissionCompleted(true);
                }}
            />
        </div>
        
        {canComplete && !missionCompleted && (
            <div className="mt-4">
                <Button size="lg" onClick={() => setMissionCompleted(true)}>
                    <CheckCircle className="mr-2 h-5 w-5"/>
                    Concluir Missão
                </Button>
            </div>
        )}

       {missionCompleted && (
        <MissionCompletionModal 
            userPlanId={userPlanId}
            onClose={handleModalClose}
        />
      )}
    </div>
  );
}


export default function VideoMissionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
        <VideoMissionPageContent />
    </Suspense>
  )
}
