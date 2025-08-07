
"use client";

import { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { BattlePlan, Mission, UserBattlePlan } from '@/lib/types';
import { Loader2, CheckCircle } from 'lucide-react';
import { MissionCompletionModal } from '@/components/battle-plans/MissionCompletionModal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

function getYoutubeVideoId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
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
  const [timeToEnable, setTimeToEnable] = useState(0);
  const playerRef = useRef<any>(null);

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

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.ENDED) {
        setCanComplete(true);
        setMissionCompleted(true);
    }
  };

  const setupPlayer = () => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        events: {
          'onStateChange': onPlayerStateChange,
        },
      });
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (typeof window.YT === 'undefined' || typeof window.YT.Player === 'undefined') {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = setupPlayer;
    } else {
        setupPlayer();
    }
    
    const progressInterval = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function' && typeof playerRef.current.getDuration === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            
            if (duration > 0) {
                const targetTime = duration * 0.8;
                if (currentTime >= targetTime) {
                    setCanComplete(true);
                    setTimeToEnable(0);
                } else {
                    setTimeToEnable(targetTime - currentTime);
                }
            }
        }
    }, 1000);


    return () => {
        clearInterval(progressInterval);
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
        }
    };
  }, [isLoading]);

  const handleModalClose = () => {
    router.push('/home'); // Or back to battle plans
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || !mission || !mission.content.verse) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-white p-4 text-center">
        <p>Erro ao carregar a missão: {error || "URL do vídeo não encontrada."}</p>
        <Button variant="link" onClick={() => router.push('/home')}>Voltar para Home</Button>
      </div>
    );
  }
  
  const videoId = getYoutubeVideoId(mission.content.verse);
  if (!videoId) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black text-white p-4 text-center">
            <p>URL do YouTube inválida.</p>
            <Button variant="link" onClick={() => router.push('/home')}>Voltar para Home</Button>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-black p-4">
        <div className="w-full max-w-4xl space-y-4">
            <div className="text-white bg-black/50 p-2 rounded-md">
                <h1 className="font-bold text-lg">{mission.title}</h1>
            </div>
            
            <div className="aspect-video w-full">
                <iframe
                    id="youtube-player"
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>

            <div className="pt-4 text-center">
                <Button 
                    size="lg" 
                    onClick={() => setMissionCompleted(true)}
                    disabled={!canComplete}
                    className={cn(
                        "transition-all",
                        !canComplete && "opacity-80"
                    )}
                >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {canComplete ? 'Concluir Missão' : `Aguarde (${formatTime(timeToEnable)})`}
                </Button>
            </div>
        </div>

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
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
        <VideoMissionPageContent />
    </Suspense>
  )
}
