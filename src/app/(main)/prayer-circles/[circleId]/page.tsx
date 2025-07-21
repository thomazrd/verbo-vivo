
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import type { PrayerCircle, PrayerRequest } from '@/lib/types';
import Link from 'next/link';

import { ArrowLeft, BookOpen, HeartHandshake, Loader2, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { InteractivePrayerButton } from '@/components/prayer/InteractivePrayerButton';
import { useTranslation } from 'react-i18next';

export default function CircleDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params.circleId as string;
  const { t } = useTranslation();

  const [circle, setCircle] = useState<PrayerCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const hasPrayed = user && circle?.prayingUsers?.includes(user.uid);

  useEffect(() => {
    if (!user || !circleId) return;
    setLoading(true);

    const circleRef = doc(db, 'prayerCircles', circleId);
    const unsubscribeCircle = onSnapshot(circleRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().members.includes(user.uid)) {
        setCircle({ id: docSnap.id, ...docSnap.data() } as PrayerCircle);
      } else {
        setError(t('error_circle_not_found_or_member'));
        setCircle(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching circle:", err);
      setError(t('error_circle_load_failed'));
      setLoading(false);
    });

    return () => {
      unsubscribeCircle();
    };
  }, [user, circleId, t]);

  const handlePrayAction = async () => {
    if (!user || !circle) return;

    const circleRef = doc(db, 'prayerCircles', circle.id);
    const newPrayingStatus = !hasPrayed;

    try {
        // Optimistically update UI
        setCircle(prev => prev ? ({
            ...prev,
            prayingUsers: newPrayingStatus
                ? [...(prev.prayingUsers || []), user.uid]
                : (prev.prayingUsers || []).filter(uid => uid !== user.uid)
        }) : null);

        await updateDoc(circleRef, {
            prayingUsers: newPrayingStatus ? arrayUnion(user.uid) : arrayRemove(user.uid),
        });
    } catch (error) {
        console.error("Error updating prayer status:", error);
        toast({ variant: "destructive", title: t('toast_error'), description: t('toast_prayer_interaction_error') });
        // Revert optimistic update on error
        setCircle(prev => prev ? ({
            ...prev,
            prayingUsers: !newPrayingStatus
                ? [...(prev.prayingUsers || []), user.uid]
                : (prev.prayingUsers || []).filter(uid => uid !== user.uid)
        }) : null);
    }
  };


  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
        <Button asChild variant="link" className="mt-4"><Link href="/prayer-circles">{t('back_to_circles_button')}</Link></Button>
      </div>
    );
  }

  if (!circle) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <header className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/prayer-circles')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{circle.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3"/>
              <span>{t('member_count', { count: circle.members.length })}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-muted/30 flex flex-col items-center">
        <div className="w-full max-w-4xl p-4 md:p-8 space-y-6 text-center">
            {/* Informações da Sala */}
            <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold tracking-tight text-primary">{t('prayer_target_title')}</h2>
                <p className="mt-2 text-muted-foreground">{circle.description || t('no_description_provided')}</p>
                {circle.baseVerse && (
                    <div className="mt-4 pt-4 border-t border-dashed text-left">
                        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-foreground"><BookOpen className="h-4 w-4 text-primary"/>{t('base_verse_title')}</h3>
                        <blockquote className="border-l-2 border-primary/50 pl-3 text-sm italic text-muted-foreground">
                            "{circle.baseVerse}"
                        </blockquote>
                    </div>
                )}
            </div>

            <Separator className="my-8" />
            
            {/* Área de Interação */}
            <div className="flex flex-col items-center justify-center py-8">
                <p className="font-semibold mb-4 text-foreground">{t('press_and_hold_prompt')}</p>
                <InteractivePrayerButton
                    isPraying={!!hasPrayed}
                    onPray={handlePrayAction}
                />
                 {circle.prayingUsers && circle.prayingUsers.length > 0 && (
                    <p className="mt-6 text-sm text-muted-foreground animate-in fade-in-0 flex items-center gap-2">
                        <HeartHandshake className="h-4 w-4 text-primary/80"/>
                        {t('prayer_warriors_count', { count: circle.prayingUsers.length })}
                    </p>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
