
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  coverImageUrl: string | null;
  title: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

export function AudioPlayer({ audioUrl, coverImageUrl, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(audioUrl);
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
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', () => setIsPlaying(false));
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl]);
  
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
      }
  }, [volume, isMuted])

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

  return (
    <div className="w-full aspect-video bg-slate-900 text-white relative overflow-hidden flex items-center justify-center rounded-lg shadow-xl">
      {coverImageUrl && (
        <Image
          src={coverImageUrl}
          alt={title}
          fill
          className="object-cover opacity-20 blur-lg scale-110"
          data-ai-hint="spiritual abstract background"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      <div className="relative z-10 w-full max-w-2xl p-4 sm:p-8 space-y-4">
          <div className="space-y-3 text-center">
            <Slider
              value={[currentTime]}
              max={duration || 0}
              onValueChange={handleSeek}
              className="w-full"
            />
            <div className="flex justify-between text-xs font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10" onClick={() => handleSeekRelative(-15)}>
              <Rewind className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button variant="ghost" size="icon" className="h-16 w-16 bg-white/10 hover:bg-white/20 rounded-full text-white hover:text-white" onClick={togglePlayPause}>
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-white/10" onClick={() => handleSeekRelative(15)}>
              <FastForward className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 absolute bottom-2 right-4">
            <button onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
            </button>
            <Slider 
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
            />
          </div>
      </div>
    </div>
  );
}
