
"use client";

import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InteractivePrayerButtonProps {
  isPraying: boolean;
  onPray: () => void;
}

const HOLD_DURATION = 1500; // 1.5 seconds

export function InteractivePrayerButton({ isPraying, onPray }: InteractivePrayerButtonProps) {
  const { t } = useTranslation();
  const [isHolding, setIsHolding] = useState(false);
  const controls = useAnimation();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    if (isPraying) return;
    setIsHolding(true);
    controls.start({
      pathLength: 1,
      transition: { duration: HOLD_DURATION / 1000, ease: "linear" }
    });
    timerRef.current = setTimeout(() => {
      onPray();
      
      // Haptic Feedback
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(50); // A short, gentle pulse
      }

      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
    }, HOLD_DURATION);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    controls.stop();
    controls.set({ pathLength: 0 });
  };
  
  // Use onMouseLeave as well to cancel if the user drags off the button
  const handleMouseLeave = () => {
    if (isHolding) {
        handleMouseUp();
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div 
        className="relative w-40 h-40 flex items-center justify-center select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="hsl(var(--primary) / 0.2)" strokeWidth="5" fill="none" />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            stroke="hsl(var(--primary))"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ pathLength: 0 }}
            animate={controls}
          />
        </svg>
        <Button
            variant={isPraying ? 'default' : 'secondary'}
            className={cn(
                "w-32 h-32 rounded-full flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300",
                isHolding && !isPraying && "bg-primary/20 scale-105",
                isPraying && "bg-primary text-primary-foreground"
            )}
            style={{ pointerEvents: 'none' }} // Button is just for visuals
        >
          <HeartHandshake className="h-8 w-8 mb-1" />
          <span className="text-sm font-semibold whitespace-normal leading-tight">
            {isPraying ? t('praying_status') : t('start_prayer_button')}
          </span>
        </Button>
      </div>
    </div>
  );
}
