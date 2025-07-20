
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc, arrayUnion, serverTimestamp, setDoc } from 'firebase/firestore';
import type { PrayerCircle } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, LogIn, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PrayerCircleOnboarding } from '@/components/prayer/PrayerCircleOnboarding';
import { CircleCard } from '@/components/prayer/CircleCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
  const { toast } = useToast();
  
  const [myCircles, setMyCircles] = useState<PrayerCircle[]>([]);
  const [publicCircles, setPublicCircles] = useState<PrayerCircle[]>([]);
  
  const [isLoadingMyCircles, setIsLoadingMyCircles] = useState(true);
  const [isLoadingPublicCircles, setIsLoadingPublicCircles] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  
  const [newCircleName, setNewCircleName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (userProfile === null && !authLoading) {
      setShowOnboarding(false);
      return;
    }
    if (userProfile && userProfile.prayerCircleOnboardingCompleted === false) {
      setShowOnboarding(true);
    }
  }, [userProfile, authLoading]);


  useEffect(() => {
    if (!user) {
        setIsLoadingMyCircles(false);
        return;
    };

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
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar seus círculos de oração." });
    });

    return () => unsubscribe();
  }, [user, toast]);

  const fetchPublicCircles = () => {
    if (!user) return;
    setIsLoadingPublicCircles(true);
    
    const q = query(collection(db, "prayerCircles"), where("isPublic", "==", true));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCircles: PrayerCircle[] = [];
      snapshot.forEach((doc) => {
        // Exclude circles the user is already a member of from the public list
        if (!doc.data().members.includes(user.uid)) {
            fetchedCircles.push({ id: doc.id, ...doc.data() } as PrayerCircle);
        }
      });
      setPublicCircles(fetchedCircles.sort((a,b) => a.name.localeCompare(b.name)));
      setIsLoadingPublicCircles(false);
    }, () => {
        setIsLoadingPublicCircles(false);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os círculos públicos." });
    });
    
    return unsubscribe;
  }

  const handleTabChange = (value: string) => {
    if (value === 'public' && publicCircles.length === 0) {
        fetchPublicCircles();
    }
  }

  const handleCreateCircle = async () => {
    if (!user || !userProfile || !newCircleName.trim()) return;
    setIsCreating(true);
    try {
      await addDoc(collection(db, "prayerCircles"), {
        name: newCircleName,
        createdBy: user.uid,
        authorName: userProfile.displayName || 'Anônimo',
        createdAt: serverTimestamp(),
        members: [user.uid],
        inviteCode: generateInviteCode(),
        isPublic: false, // Default to private
      });
      toast({ title: "Sucesso!", description: "Círculo de oração criado." });
      setNewCircleName("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating circle:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar o círculo." });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCircle = async () => {
    if (!user || !inviteCode.trim()) return;
    setIsJoining(true);
    try {
      const q = query(collection(db, "prayerCircles"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "Erro", description: "Código de convite inválido." });
      } else {
        const circleDoc = querySnapshot.docs[0];
        if (circleDoc.data().members.includes(user.uid)) {
          toast({ variant: "default", title: "Aviso", description: "Você já é membro deste círculo." });
        } else {
          await updateDoc(doc(db, "prayerCircles", circleDoc.id), {
            members: arrayUnion(user.uid)
          });
          toast({ title: "Bem-vindo(a)!", description: `Você entrou no círculo "${circleDoc.data().name}".` });
        }
        setInviteCode("");
        setIsJoinDialogOpen(false);
      }
    } catch (error) {
      console.error("Error joining circle:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível entrar no círculo." });
    } finally {
      setIsJoining(false);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user) return;
    try {
        await setDoc(doc(db, 'users', user.uid), { prayerCircleOnboardingCompleted: true }, { merge: true });
        setShowOnboarding(false);
    } catch (error) {
        console.error("Failed to update onboarding status", error);
        setShowOnboarding(false); // still hide it to not block the user
    }
  }

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
      return <PrayerCircleOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Círculos de Oração</h1>
          <p className="mt-1 text-muted-foreground">
            Compartilhe pedidos e ore com seus grupos privados.
          </p>
        </div>
      </div>
      
       <Tabs defaultValue="mine" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="mine">Minhas Salas</TabsTrigger>
                <TabsTrigger value="public">Salas Públicas</TabsTrigger>
            </TabsList>
            <TabsContent value="mine">
                <CircleList
                    circles={myCircles}
                    isLoading={isLoadingMyCircles}
                    emptyStateMessage="Você ainda não faz parte de nenhum círculo. Crie um ou entre com um código de convite."
                />
            </TabsContent>
            <TabsContent value="public">
                <CircleList
                    circles={publicCircles}
                    isLoading={isLoadingPublicCircles}
                    emptyStateMessage="Nenhuma sala pública disponível no momento."
                />
            </TabsContent>
        </Tabs>

    </div>
    
    {/* Floating Action Button */}
    <Popover>
        <PopoverTrigger asChild>
            <Button className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-10">
                <Plus className="h-6 w-6" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end" side="top" sideOffset={12}>
            <div className="flex flex-col gap-1">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" className="justify-start">
                            <Plus className="mr-2 h-4 w-4" /> Criar Círculo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Criar Novo Círculo</DialogTitle>
                            <DialogDescription>Dê um nome para o seu novo círculo de oração.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="circle-name" className="text-right">Nome</Label>
                            <Input id="circle-name" value={newCircleName} onChange={(e) => setNewCircleName(e.target.value)} className="col-span-3" placeholder="Ex: Grupo de Estudo Bíblico" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateCircle} disabled={isCreating || !newCircleName.trim()}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Círculo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                    <DialogTrigger asChild>
                         <Button variant="ghost" className="justify-start">
                            <LogIn className="mr-2 h-4 w-4" /> Entrar com Código
                        </Button>
                    </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Entrar em um Círculo</DialogTitle>
                            <DialogDescription>Insira o código de convite para participar de um círculo de oração.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="invite-code" className="text-right">Código</Label>
                            <Input id="invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="col-span-3 font-mono tracking-widest" placeholder="ABCXYZ" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleJoinCircle} disabled={isJoining || !inviteCode.trim()}>
                            {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Entrar no Círculo
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
