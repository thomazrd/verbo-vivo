
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion, getDocs } from 'firebase/firestore';
import type { PrayerCircle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, LogIn, Loader2, Globe, Lock, Trophy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CircleCard } from '@/components/prayer/CircleCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { PrayerCircleOnboarding } from '@/components/prayer/PrayerCircleOnboarding';
import Link from 'next/link';

const CircleList = ({ circles, isLoading, emptyStateMessage }: { circles: PrayerCircle[], isLoading: boolean, emptyStateMessage: string }) => {
    if (isLoading) {
        return (
             <div className="mt-8 space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
             </div>
        );
    }
    
    if (circles.length === 0) {
        return (
            <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                    {emptyStateMessage}
                </p>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-4">
            {circles.map((circle) => (
                <CircleCard key={circle.id} circle={circle} />
            ))}
        </div>
    );
};


export default function PrayerCirclesPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [myCircles, setMyCircles] = useState<PrayerCircle[]>([]);
  const [publicCircles, setPublicCircles] = useState<PrayerCircle[]>([]);
  
  const [isLoadingMyCircles, setIsLoadingMyCircles] = useState(true);
  const [isLoadingPublicCircles, setIsLoadingPublicCircles] = useState(false);
  const [publicCirclesFetched, setPublicCirclesFetched] = useState(false);
  
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  
  const [inviteCode, setInviteCode] = useState("");
  
  const [isJoining, setIsJoining] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  

  useEffect(() => {
    if (!user) {
        setIsLoadingMyCircles(false);
        return;
    };
    
    if (userProfile && userProfile.prayerCircleOnboardingCompleted === false) {
      setShowOnboarding(true);
      setIsLoadingMyCircles(false);
      return;
    }

    setIsLoadingMyCircles(true);
    const q = query(collection(db, "prayerCircles"), where("members", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userCircles: PrayerCircle[] = [];
      snapshot.forEach((doc) => {
        userCircles.push({ id: doc.id, ...doc.data() } as PrayerCircle);
      });
      setMyCircles(userCircles.sort((a,b) => a.name.localeCompare(b.name)));
      setIsLoadingMyCircles(false);
    }, () => {
      setIsLoadingMyCircles(false);
      toast({ variant: "destructive", title: t('toast_error'), description: t('toast_my_circles_load_error') });
    });

    return () => unsubscribe();
  }, [user, userProfile, t, toast]);

  useEffect(() => {
    if (!user || !publicCirclesFetched) {
      return;
    };
    
    const fetchPublicCircles = () => {
      setIsLoadingPublicCircles(true);
      const q = query(collection(db, "prayerCircles"), where("isPublic", "==", true));
      
      const unsubscribePublic = onSnapshot(q, (snapshot) => {
        const fetchedCircles: PrayerCircle[] = [];
        snapshot.forEach((doc) => {
            fetchedCircles.push({ id: doc.id, ...doc.data() } as PrayerCircle);
        });
        setPublicCircles(fetchedCircles.sort((a,b) => a.name.localeCompare(b.name)));
        setIsLoadingPublicCircles(false);
      }, () => {
          setIsLoadingPublicCircles(false);
          toast({ variant: "destructive", title: t('toast_error'), description: t('toast_public_circles_load_error') });
      });
      
      return unsubscribePublic;
    }
    
    const unsubscribe = fetchPublicCircles();
    return () => unsubscribe();

  }, [user, publicCirclesFetched, toast, t]);

  const handleTabChange = (value: string) => {
    if (value === 'public' && !publicCirclesFetched) {
        setPublicCirclesFetched(true);
    }
  }
  
  const handleOnboardingComplete = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { prayerCircleOnboardingCompleted: true });
      setShowOnboarding(false);
    } catch(e) {
      console.error(e);
      setShowOnboarding(false); // Let the user proceed even if update fails
    }
  }

  const handleJoinCircle = async () => {
    if (!user || !inviteCode.trim()) return;
    setIsJoining(true);
    try {
      const q = query(collection(db, "prayerCircles"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: t('toast_error'), description: t('toast_invalid_invite_code') });
      } else {
        const circleDoc = querySnapshot.docs[0];
        if (circleDoc.data().members.includes(user.uid)) {
          toast({ variant: "default", title: t('toast_info'), description: t('toast_already_a_member') });
        } else {
          await updateDoc(doc(db, "prayerCircles", circleDoc.id), {
            members: arrayUnion(user.uid)
          });
          toast({ title: t('welcome'), description: t('toast_joined_circle', { name: circleDoc.data().name }) });
        }
        setInviteCode("");
        setIsJoinDialogOpen(false);
      }
    } catch (error) {
      console.error("Error joining circle:", error);
      toast({ variant: "destructive", title: t('toast_error'), description: t('toast_join_circle_error') });
    } finally {
      setIsJoining(false);
    }
  };


  if (authLoading) {
     return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
        <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-80" />
            </div>
        </div>
         <Skeleton className="h-10 w-full" />
        <div className="mt-8 space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }
  
  if (showOnboarding) {
    return <PrayerCircleOnboarding onComplete={handleOnboardingComplete} />
  }

  return (
    <>
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('prayer_circles_title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('prayer_circles_subtitle')}
          </p>
        </div>
        <Button variant="outline" asChild className="border-amber-400 text-amber-800 hover:bg-amber-100 hover:text-amber-900">
          <Link href="/prayer-circles/victories">
            <Trophy className="mr-2 h-4 w-4" />
            Hall da Honra
          </Link>
        </Button>
      </div>
      
       <Tabs defaultValue="mine" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mine">{t('my_rooms_tab')}</TabsTrigger>
                <TabsTrigger value="public">{t('public_rooms_tab')}</TabsTrigger>
            </TabsList>
            <TabsContent value="mine">
                <CircleList
                    circles={myCircles}
                    isLoading={isLoadingMyCircles}
                    emptyStateMessage={t('empty_state_my_circles')}
                />
            </TabsContent>
            <TabsContent value="public">
                <CircleList
                    circles={publicCircles}
                    isLoading={isLoadingPublicCircles}
                    emptyStateMessage={t('empty_state_public_circles')}
                />
            </TabsContent>
        </Tabs>

    </div>
    
    <Popover>
        <PopoverTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-10">
                <Plus className="h-6 w-6" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end" side="top" sideOffset={12}>
            <div className="flex flex-col gap-1">
                <Button variant="ghost" className="justify-start" onClick={() => router.push('/prayer-circles/new')}>
                    <Plus className="mr-2 h-4 w-4" /> {t('create_circle_button_popover')}
                </Button>
                
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="ghost" className="justify-start">
                            <LogIn className="mr-2 h-4 w-4" /> {t('join_with_code_button_popover')}
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('join_circle_title_modal')}</DialogTitle>
                            <DialogDescription>{t('join_circle_desc_modal')}</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="invite-code" className="text-right">{t('code_label_modal')}</Label>
                            <Input id="invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="col-span-3 font-mono tracking-widest" placeholder="ABCXYZ" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleJoinCircle} disabled={isJoining || !inviteCode.trim()}>
                            {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('join_circle_button_modal')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PopoverContent>
    </Popover>
    </>
  );
}
