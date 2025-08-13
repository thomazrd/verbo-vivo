
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface CustomYoutubePlayerProps {
  videoId: string;
  onVideoEnd?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
}

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const floorSeconds = Math.floor(seconds);
    const min = Math.floor(floorSeconds / 60);
    const sec = floorSeconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

const loadYouTubeAPI = () => {
    if (window.YT && window.YT.Player) {
      return;
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
};

export function CustomYoutubePlayer({ videoId, onVideoEnd, onProgress }: CustomYoutubePlayerProps) {
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    loadYouTubeAPI();
    window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    
    if (window.YT && window.YT.Player) {
        setIsApiReady(true);
    }
    
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (isApiReady && playerContainerRef.current) {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(playerContainerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: 0, controls: 0, rel: 0, showinfo: 0, modestbranding: 1, iv_load_policy: 3,
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange,
        },
      });
    }
  }, [isApiReady, videoId]);

  useEffect(() => {
    // Sincroniza o estado de play/pause do React com o player do YouTube
    if (!isPlayerReady || !playerRef.current?.playVideo || !playerRef.current?.pauseVideo) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isPlayerReady]);

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          const currentTime = playerRef.current.getCurrentTime();
          const videoDuration = playerRef.current.getDuration();
          if (videoDuration > 0) {
            setDuration(videoDuration);
            setProgress(currentTime);
            onProgress?.(currentTime, videoDuration);
          }
        }
      }, 500);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, onProgress]);
  
  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume((isMuted ? 0 : volume) * 100);
    }
  }, [volume, isMuted]);

  const onPlayerReady = (event: any) => {
    setDuration(event.target.getDuration());
    setIsPlayerReady(true);
  };

  const onPlayerStateChange = (event: any) => {
    setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
    if (event.data === window.YT.PlayerState.PLAYING) {
        resetControlsTimeout();
    } else {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    if (event.data === window.YT.PlayerState.ENDED) {
        onVideoEnd?.();
    }
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(value[0], true);
      setProgress(value[0]);
    }
  };

  return (
    <div 
        className="aspect-video w-full relative bg-black overflow-hidden" 
        onMouseMove={resetControlsTimeout} 
        onMouseLeave={() => { if (isPlaying) setShowControls(false) }}
    >
      <div ref={playerContainerRef} className="w-full h-full"></div>
      
      <AnimatePresence>
        {!isPlayerReady && (
             <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-white animate-spin"/>
            </div>
        )}
        {showControls && isPlayerReady && (
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
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider value={[isMuted ? 0 : volume]} max={1} step={0.1} className="w-20" onValueChange={(v) => { setIsMuted(false); setVolume(v[0]); }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
