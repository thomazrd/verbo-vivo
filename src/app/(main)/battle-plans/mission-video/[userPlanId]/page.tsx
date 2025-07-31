
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { BattlePlan, Mission, UserBattlePlan } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { MissionCompletionModal } from '@/components/battle-plans/MissionCompletionModal';

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

  const handleVideoEnd = () => {
    setMissionCompleted(true);
  };
  
  const handleModalClose = () => {
    router.push('/home'); // Or back to battle plans
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-white" />
      </div>
    );
  }

  if (error || !mission || !mission.content.verse) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white p-4 text-center">
        <p>Erro ao carregar a missão: {error || "URL do vídeo não encontrada."}</p>
        <Button variant="link" onClick={() => router.push('/home')}>Voltar para Home</Button>
      </div>
    );
  }
  
  const videoId = getYoutubeVideoId(mission.content.verse);
  if (!videoId) {
    return <div className="flex h-screen w-screen items-center justify-center bg-black text-white"><p>URL do YouTube inválida.</p></div>
  }

  return (
    <div className="relative h-screen w-screen bg-black flex flex-col items-center justify-center">
        <div className="absolute top-4 left-4 z-20 text-white bg-black/50 p-2 rounded-md">
            <h1 className="font-bold">{mission.title}</h1>
        </div>
      <iframe
        className="w-full h-full z-10"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&enablejsapi=1`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onEnded={handleVideoEnd} // Note: This is a conceptual example, direct onEnded is not a prop. We'll use the API.
      ></iframe>
       {missionCompleted && (
        <MissionCompletionModal 
            userPlanId={userPlanId}
            onClose={handleModalClose}
        />
      )}
      <script src="https://www.youtube.com/iframe_api" async></script>
      <script dangerouslySetInnerHTML={{__html: `
        let player;
        function onYouTubeIframeAPIReady() {
            const iframe = document.querySelector('iframe');
            if (!iframe) return;
            player = new YT.Player(iframe, {
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        }
        function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.ENDED) {
                // This is a workaround to communicate with React state
                const customEvent = new CustomEvent('videoEnded');
                window.dispatchEvent(customEvent);
            }
        }
        window.addEventListener('videoEnded', () => {
            // This is where React will listen
            // This script is injected, so direct call to React state setter is not possible
            // The React component will listen for this 'videoEnded' event
        });
      `}}/>
    </div>
  );
}


// Event listener setup in a React component
function YouTubePlayerController({ onVideoEnd }: { onVideoEnd: () => void }) {
  useEffect(() => {
    const handleEnd = () => onVideoEnd();
    window.addEventListener('videoEnded', handleEnd);
    return () => window.removeEventListener('videoEnded', handleEnd);
  }, [onVideoEnd]);
  return null;
}

export default function VideoMissionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-black"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>}>
        <VideoMissionPageContent />
    </Suspense>
  )
}
