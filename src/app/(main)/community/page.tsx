
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, getDocs, updateDoc, doc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
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

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
        setUserProfile(profile);
        if (profile.congregationId && (profile.congregationStatus === 'MEMBER' || profile.congregationStatus === 'ADMIN')) {
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
        setUserProfile(null);
      }
    });

    return () => unsubscribeUser();
  }, [user]);

  const handleCreateCongregation = async () => {
    if (!user || !newCongregationName.trim()) return;
    setIsCreating(true);
    try {
      const newCongregationData = {
        name: newCongregationName,
        city: newCongregationCity,
        pastorName: newCongregationPastor,
        admins: { [user.uid]: true },
        memberCount: 1,
        inviteCode: generateInviteCode(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      };
      
      const congregationRef = await addDoc(collection(db, "congregations"), newCongregationData);
      
      const memberRef = doc(db, 'congregations', congregationRef.id, 'members', user.uid);
      await setDoc(memberRef, {
        displayName: user.displayName || user.email,
        photoURL: user.photoURL,
        joinedAt: serverTimestamp(),
        status: 'APPROVED',
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
          congregationId: congregationRef.id,
          congregationStatus: 'ADMIN'
      });

      toast({ title: "Sucesso!", description: "Congregação criada." });
      setNewCongregationName("");
      setNewCongregationCity("");
      setNewCongregationPastor("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating congregation:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a congregação." });
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleJoinCongregation = async () => {
      if (!user || !inviteCode.trim()) return;
      setIsJoining(true);
      try {
          const q = query(collection(db, "congregations"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
              toast({ variant: "destructive", title: "Erro", description: "Código de convite inválido." });
          } else {
              const congregationDoc = querySnapshot.docs[0];
              const congregationId = congregationDoc.id;

              const memberRef = doc(db, 'congregations', congregationId, 'members', user.uid);
              const memberSnap = await getDoc(memberRef);

              if (memberSnap.exists() || userProfile?.congregationId === congregationId) {
                  toast({ title: "Aviso", description: `Você já solicitou ou é membro de "${congregationDoc.data().name}".` });
              } else {
                  await setDoc(memberRef, {
                      displayName: user.displayName || user.email,
                      photoURL: user.photoURL,
                      status: 'PENDING',
                      requestedAt: serverTimestamp()
                  });

                  const userRef = doc(db, 'users', user.uid);
                  await updateDoc(userRef, {
                      congregationId: congregationId,
                      congregationStatus: 'PENDING'
                  });

                  toast({ title: "Solicitação enviada!", description: `Sua solicitação para entrar em "${congregationDoc.data().name}" foi enviada para aprovação.` });
              }
              setInviteCode("");
              setIsJoinDialogOpen(false);
          }
      } catch (error) {
          console.error("Error joining congregation:", error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível solicitar a entrada na congregação." });
      } finally {
          setIsJoining(false);
      }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Comunidade</h1>
          <p className="mt-1 text-muted-foreground">
            Conecte-se com os membros da sua igreja local.
          </p>
        </div>
        <div className="flex gap-2">
            <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><LogIn className="mr-2 h-4 w-4" /> Entrar</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Entrar em uma Congregação</DialogTitle>
                        <DialogDescription>Insira o código de convite para solicitar a entrada.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label htmlFor="invite-code">Código de Convite</Label>
                        <Input id="invite-code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="font-mono tracking-widest" placeholder="ABCXYZ" />
                    </div>
                    <DialogFooter>
                        <Button onClick={handleJoinCongregation} disabled={isJoining || !inviteCode.trim()}>
                        {isJoining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Solicitar Entrada
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Criar</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Criar Nova Congregação</DialogTitle>
                        <DialogDescription>Preencha os detalhes da sua igreja.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="cong-name">Nome da Igreja</Label>
                            <Input id="cong-name" value={newCongregationName} onChange={(e) => setNewCongregationName(e.target.value)} placeholder="Ex: Primeira Igreja Batista" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cong-city">Cidade</Label>
                            <Input id="cong-city" value={newCongregationCity} onChange={(e) => setNewCongregationCity(e.target.value)} placeholder="Ex: São Paulo, SP" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cong-pastor">Pastor Responsável</Label>
                            <Input id="cong-pastor" value={newCongregationPastor} onChange={(e) => setNewCongregationPastor(e.target.value)} placeholder="Ex: Pr. João da Silva" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateCongregation} disabled={isCreating || !newCongregationName.trim()}>
                        {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Criar Congregação
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {!congregation && userProfile?.congregationStatus !== 'PENDING' && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">Você ainda não faz parte de uma congregação</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie uma nova congregação para sua igreja ou entre em uma existente com um código de convite.
            </p>
          </div>
        )}
        
        {userProfile?.congregationStatus === 'PENDING' && (
             <Card>
                <CardHeader className="text-center">
                    <CardTitle>Solicitação Pendente</CardTitle>
                    <CardDescription>
                        Sua solicitação para entrar em uma congregação está aguardando aprovação de um administrador.
                    </CardDescription>
                </CardHeader>
             </Card>
        )}

        {congregation && (
            <Link href={`/community/${congregation.id}`} className="block">
                <Card className="transition-all hover:shadow-md hover:border-primary/50">
                    <div className="flex items-center justify-between p-4 sm:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <Church className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                            <CardTitle className="text-lg font-semibold">{congregation.name}</CardTitle>
                            <CardDescription>{congregation.memberCount} membro(s)</CardDescription>
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
