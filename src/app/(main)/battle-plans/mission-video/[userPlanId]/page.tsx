
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
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Player State
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [canComplete, setCanComplete] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 3000);
    }
  };

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const onPlayerReady = (event: any) => {
    event.target.setVolume(volume * 100);
    setDuration(event.target.getDuration());
    event.target.playVideo();
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
        setIsPlaying(true);
        resetControlsTimeout();
    } else {
        setIsPlaying(false);
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    if (event.data === window.YT.PlayerState.ENDED) {
        setCanComplete(true);
        setMissionCompleted(true);
    }
  };

  const setupPlayer = () => {
    if (window.YT && window.YT.Player) {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: getYoutubeVideoId(mission?.content.verse || ''),
        playerVars: {
            autoplay: 1,
            controls: 0, // Oculta os controles nativos
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            iv_load_policy: 3,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
        },
      });
    }
  };

  useEffect(() => {
    if (isLoading || !mission?.content.verse) return;

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
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            const videoDuration = playerRef.current.getDuration();
            if(videoDuration > 0) setDuration(videoDuration);
            setProgress(currentTime);
            
            const targetTime = videoDuration * 0.8;
            if (currentTime >= targetTime) {
                setCanComplete(true);
            }
        }
    }, 500);


    return () => {
        clearInterval(progressInterval);
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, mission]);
  
   useEffect(() => {
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume((isMuted ? 0 : volume) * 100);
    }
  }, [volume, isMuted]);

  const handleModalClose = () => {
    router.push('/home'); // Or back to battle plans
  };
  
  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value[0], true);
      setProgress(value[0]);
    }
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
            
            <div className="aspect-video w-full relative bg-black overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={() => { if(isPlaying) setShowControls(false)}}>
                <div id="youtube-player" className="w-full h-full"></div>
                
                 <AnimatePresence>
                    {showControls && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-black/30 flex flex-col justify-between p-2 sm:p-4"
                        >
                            <div></div>
                            <div className="flex justify-center items-center">
                                 <Button variant="ghost" className="h-16 w-16 text-white" onClick={handlePlayPause}>
                                     {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10" />}
                                 </Button>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-white text-xs">
                                    <span>{formatTime(progress)}</span>
                                    <Slider value={[progress]} max={duration} onValueChange={handleSeek} />
                                    <span>{formatTime(duration)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-white" onClick={() => setIsMuted(!isMuted)}>
                                            {isMuted || volume === 0 ? <VolumeX className="h-4 w-4"/> : <Volume2 className="h-4 w-4"/>}
                                        </Button>
                                         <Slider value={[isMuted ? 0 : volume]} max={1} step={0.1} className="w-20" onValueChange={(v) => { setIsMuted(false); setVolume(v[0]); }}/>
                                    </div>
                                    <Button size="sm" onClick={() => setMissionCompleted(true)} disabled={!canComplete}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Concluir Missão
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                 </AnimatePresence>
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
    <Suspense fallback={<div className="flex min-h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
        <VideoMissionPageContent />
    </Suspense>
  )
}


    