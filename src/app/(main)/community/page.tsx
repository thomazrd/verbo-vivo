
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import type { Congregation, UserProfile } from '@/lib/types';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, LogIn, ChevronRight, Loader2, Church } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CommunityPage() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState("");
  const [newCongregationCity, setNewCongregationCity] = useState("");
  const [newCongregationPastor, setNewCongregationPastor] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = { ...docSnap.data() } as UserProfile;
        if (profile.congregationId && (profile.congregationStatus === 'MEMBER' || profile.congregationStatus === 'ADMIN' || profile.congregationStatus === 'PENDING')) {
            const congRef = doc(db, 'congregations', profile.congregationId);
            const unsubscribeCong = onSnapshot(congRef, (congDoc) => {
                if (congDoc.exists()) {
                    setCongregation({ id: congDoc.id, ...congDoc.data()} as Congregation);
                } else {
                    setCongregation(null);
                }
                setIsLoading(false);
            });
            return () => unsubscribeCong();
        } else {
            setCongregation(null);
            setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribeUser();
  }, [user]);

  const handleCreateCongregation = async () => {
    if (!user || !newCongregationName.trim() || userProfile?.congregationId) return;
    setIsCreating(true);
    
    try {
        const functions = getFunctions();
        const createCongregation = httpsCallable(functions, 'createCongregation');
        await createCongregation({
            name: newCongregationName,
            city: newCongregationCity,
            pastorName: newCongregationPastor,
        });

        toast({ title: t('toast_success'), description: t('toast_congregation_created') });
        setNewCongregationName("");
        setNewCongregationCity("");
        setNewCongregationPastor("");
        setIsCreateDialogOpen(false);

    } catch (error: any) {
      console.error("Error creating congregation:", error);
      toast({ variant: "destructive", title: t('toast_error'), description: error.message || t('toast_congregation_create_error') });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinCongregation = async () => {
      if (!user || !inviteCode.trim() || userProfile?.congregationId) return;
      setIsJoining(true);
      
      try {
        const functions = getFunctions();
        const requestToJoin = httpsCallable(functions, 'requestToJoinCongregation');
        const result = await requestToJoin({ inviteCode: inviteCode.trim().toUpperCase() });
        const data = result.data as { success: boolean, message: string, congregationName?: string };

        if(data.success) {
            toast({ title: t('toast_request_sent'), description: t('toast_join_request_sent', { name: data.congregationName }) });
            setInviteCode("");
            setIsJoinDialogOpen(false);
        } else {
             toast({ variant: "destructive", title: t('toast_error'), description: data.message });
        }

      } catch (error: any) {
          console.error("Error joining congregation:", error);
          toast({ variant: "destructive", title: t('toast_error'), description: error.message || t('toast_join_request_error') });
      } finally {
          setIsJoining(false);
      }
  }

  const userHasCongregation = !!userProfile?.congregationId;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav_community')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('community_subtitle')}
          </p>
        </div>
        <TooltipProvider>
            <div className="flex gap-2">
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div tabIndex={0}>
                            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" disabled={userHasCongregation}>
                                        <LogIn className="mr-2 h-4 w-4" /> {t('join_button')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('join_congregation_title')}</DialogTitle>
                                        <DialogDescription>{t('join_congregation_desc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <Label htmlFor="invite-code">{t('invite_code_label')}</Label>
                                        <Input id="invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="font-mono tracking-widest" placeholder="ABCXYZ" />
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleJoinCongregation} disabled={isJoining || !inviteCode.trim()}>
                                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('request_join_button')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TooltipTrigger>
                    {userHasCongregation && <TooltipContent><p>{t('community_tooltip_leave_to_join')}</p></TooltipContent>}
                 </Tooltip>
                
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <div tabIndex={0}>
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button disabled={userHasCongregation}><Plus className="mr-2 h-4 w-4" /> {t('create_button')}</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{t('create_congregation_title')}</DialogTitle>
                                        <DialogDescription>{t('create_congregation_desc')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cong-name">{t('church_name_label')}</Label>
                                            <Input id="cong-name" value={newCongregationName} onChange={(e) => setNewCongregationName(e.target.value)} placeholder={t('church_name_placeholder')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cong-city">{t('city_label')}</Label>
                                            <Input id="cong-city" value={newCongregationCity} onChange={(e) => setNewCongregationCity(e.target.value)} placeholder={t('city_placeholder')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cong-pastor">{t('pastor_name_label')}</Label>
                                            <Input id="cong-pastor" value={newCongregationPastor} onChange={(e) => setNewCongregationPastor(e.target.value)} placeholder={t('pastor_name_placeholder')} />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCreateCongregation} disabled={isCreating || !newCongregationName.trim()}>
                                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {t('create_congregation_button')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TooltipTrigger>
                     {userHasCongregation && <TooltipContent><p>{t('community_tooltip_leave_to_create')}</p></TooltipContent>}
                </Tooltip>
            </div>
        </TooltipProvider>
      </div>

      <div className="mt-8 space-y-4">
        {!congregation && userProfile?.congregationStatus !== 'PENDING' && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">{t('no_congregation_title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('no_congregation_desc')}
            </p>
          </div>
        )}
        
        {userProfile?.congregationStatus === 'PENDING' && congregation && (
             <Card>
                <CardHeader className="text-center">
                    <CardTitle>{t('pending_request_title')}</CardTitle>
                    <CardDescription>
                        {t('pending_request_desc', { name: congregation.name })}
                    </CardDescription>
                </CardHeader>
             </Card>
        )}

        {congregation && userProfile?.congregationStatus !== 'PENDING' && (
            <Link href={`/community/${congregation.id}`} className="block">
                <Card className="transition-all hover:shadow-md hover:border-primary/50">
                    <div className="flex items-center justify-between p-4 sm:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Church className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                            <CardTitle className="text-lg font-semibold">{congregation.name}</CardTitle>
                            <CardDescription>{t('member_count', { count: congregation.memberCount })}</CardDescription>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Card>
            </Link>
        )}
        </div>
    </div>
  );
}

    