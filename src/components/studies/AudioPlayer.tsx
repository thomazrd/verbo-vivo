
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX, Bookmark, Share2, Gauge } from 'lucide-react';
import type { Study } from '@/lib/types';

interface AudioPlayerProps {
  study: Study;
  onShare: () => void;
}

const DEFAULT_THUMBNAIL = "https://dynamic.tiggomark.com.br/images/deep_dive.jpg";
const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

export function AudioPlayer({ study, onShare }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const imageUrl = study.thumbnailUrl || DEFAULT_THUMBNAIL;

  useEffect(() => {
    const audio = new Audio(study.audioUrl);
    audioRef.current = audio;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [study.audioUrl]);
  
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
      }
  }, [volume, isMuted])

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };
  
  const handleSeekRelative = (amount: number) => {
    if (audioRef.current) {
        const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + amount));
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }
  }
  
  const handleVolumeChange = (value: number[]) => {
      setVolume(value[0]);
      if(value[0] === 0) {
          setIsMuted(true);
      } else if (isMuted) {
          setIsMuted(false);
      }
  }

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  }

  return (
    <div className="w-full bg-slate-900 text-white rounded-lg shadow-xl p-4 flex flex-col sm:flex-row items-center gap-4">
      {/* Album Art & Title */}
      <div className="flex items-center gap-4 w-full sm:w-1/3">
        <div className="relative w-16 h-16 shrink-0">
            <Image
            src={imageUrl}
            alt={study.title}
            fill
            className="object-cover rounded-md"
            data-ai-hint="study album art"
            />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm truncate">{study.title}</h2>
          <p className="text-xs text-muted-foreground truncate">{study.authorName}</p>
        </div>
      </div>

      {/* Player Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-2 w-full sm:w-1/3">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10" onClick={() => handleSeekRelative(-15)}>
                <Rewind className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-12 w-12 sm:h-14 sm:w-14 bg-white/90 hover:bg-white rounded-full text-slate-900" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="h-6 w-6 sm:h-8 sm:w-8" /> : <Play className="h-6 w-6 sm:h-8 sm:w-8 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10" onClick={() => handleSeekRelative(15)}>
                <FastForward className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
        </div>

         <div className="w-full flex items-center gap-2 text-xs font-mono">
            <span>{formatTime(currentTime)}</span>
            <Slider
                value={[currentTime]}
                max={duration || 0}
                onValueChange={handleSeek}
                className="w-full"
            />
            <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume, Speed & Share Control */}
      <div className="w-full sm:w-1/3 flex items-center justify-end gap-2">
         <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8 relative" onClick={cyclePlaybackRate}>
                <Gauge className="h-5 w-5"/>
                <span className="absolute -bottom-1 -right-1 text-[9px] font-bold bg-white/20 rounded-full h-4 w-4 flex items-center justify-center">{playbackRate}x</span>
            </Button>
            <button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
            </button>
            <Slider 
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
            />
         </div>
         <Button
            size="sm"
            onClick={onShare}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
      </div>
    </div>
  );
}
