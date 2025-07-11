
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, writeBatch, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import type { Congregation, CongregationMember } from '@/lib/types';

import { ArrowLeft, Check, ShieldCheck, UserX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberCard } from '@/components/community/MemberCard';
import { useToast } from '@/hooks/use-toast';

export default function ManageCongregationPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const congregationId = params.congregationId as string;
  const { toast } = useToast();

  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [members, setMembers] = useState<CongregationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});


  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        router.push('/login');
        return;
    }
    
    // Once auth is done, check the profile
    if(userProfile) {
        const isAdmin = userProfile?.congregationStatus === 'ADMIN' && userProfile?.congregationId === congregationId;
        if (!isAdmin) {
             router.push(`/community/${congregationId}`);
             return;
        }

        const congRef = doc(db, 'congregations', congregationId);
        const membersRef = collection(db, 'congregations', congregationId, 'members');

        const unsubCongregation = onSnapshot(congRef, (doc) => {
          if (doc.exists()) {
            setCongregation({ id: doc.id, ...doc.data() } as Congregation);
          } else {
            router.push('/community');
          }
        });

        const unsubMembers = onSnapshot(membersRef, (snapshot) => {
          const allMembers: CongregationMember[] = [];
          snapshot.forEach((doc) => {
            allMembers.push({ id: doc.id, ...doc.data() } as CongregationMember);
          });
          setMembers(allMembers);
          setLoading(false);
        }, () => {
            // Error fetching members
            setLoading(false);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os membros.'});
        });

        return () => {
            unsubCongregation();
            unsubMembers();
        };
    } else if (!authLoading && !userProfile) {
        // Auth is done, but profile doesn't exist, they can't be an admin.
        router.push('/community');
    }

  }, [congregationId, router, authLoading, user, userProfile, toast]);

  const handleMemberAction = async (
    targetUserId: string, 
    action: 'approve' | 'reject' | 'promote' | 'remove'
  ) => {
    setActionInProgress(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const batch = writeBatch(db);
      const congregationRef = doc(db, 'congregations', congregationId);
      const memberRef = doc(db, 'congregations', congregationId, 'members', targetUserId);
      const userRef = doc(db, 'users', targetUserId);

      switch (action) {
        case 'approve':
          batch.update(memberRef, { status: 'APPROVED', joinedAt: serverTimestamp() });
          batch.update(userRef, { congregationStatus: 'MEMBER' });
          batch.update(congregationRef, { memberCount: increment(1) });
          toast({ title: "Membro Aprovado!", description: "O usuário agora faz parte da congregação." });
          break;
        case 'reject':
          batch.delete(memberRef);
          batch.update(userRef, { congregationId: null, congregationStatus: 'NONE' });
          toast({ title: "Solicitação Rejeitada." });
          break;
        case 'promote':
            batch.update(memberRef, { status: 'ADMIN' });
            batch.update(userRef, { congregationStatus: 'ADMIN' });
            toast({ title: "Membro Promovido!", description: "O usuário agora é um administrador." });
            break;
        case 'remove':
            const currentMemberDoc = await getDoc(memberRef);
            if (!currentMemberDoc.exists()) {
                throw new Error("Member not found");
            }
            const currentMember = currentMemberDoc.data();

            batch.delete(memberRef);
            batch.update(userRef, { congregationId: null, congregationStatus: 'NONE' });
            
            if(currentMember && (currentMember.status === 'MEMBER' || currentMember.status === 'ADMIN' || currentMember.status === 'APPROVED')) {
              batch.update(congregationRef, { memberCount: increment(-1) });
            }
            toast({ title: "Membro Removido." });
            break;
      }
      
      await batch.commit();

    } catch (error) {
      console.error(`Error performing action ${action} on user ${targetUserId}:`, error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível completar a ação. Verifique as permissões.' });
    } finally {
      setActionInProgress(prev => ({ ...prev, [targetUserId]: false }));
    }
  };


  const pendingMembers = members.filter((m) => m.status === 'PENDING');
  const approvedMembers = members.filter((m) => m.status === 'MEMBER' || m.status === 'ADMIN' || m.status === 'APPROVED');

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
        <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-9 w-9" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Comunidade</h1>
          <p className="text-muted-foreground">{congregation?.name}</p>
        </div>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" disabled>Início</TabsTrigger>
          <TabsTrigger value="pending">
            Pendentes {pendingMembers.length > 0 && `(${pendingMembers.length})`}
          </TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="reports" disabled>Denúncias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Em breve</CardTitle>
                    <CardDescription>Painel com estatísticas da comunidade.</CardDescription>
                </CardHeader>
            </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
              <CardDescription>Aprove ou rejeite os pedidos para entrar na sua comunidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma solicitação pendente.</p>
              ) : (
                pendingMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    actions={
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-500"
                          onClick={() => handleMemberAction(member.id, 'reject')}
                          disabled={actionInProgress[member.id]}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="h-8 w-8 bg-green-500 hover:bg-green-600"
                          onClick={() => handleMemberAction(member.id, 'approve')}
                          disabled={actionInProgress[member.id]}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </>
                    }
                    actionInProgress={actionInProgress[member.id]}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Membros</CardTitle>
                    <CardDescription>Veja todos os membros da sua congregação.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {approvedMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum membro na congregação.</p>
                    ) : (
                        approvedMembers
                            .sort((a,b) => (a.displayName || '').localeCompare(b.displayName || ''))
                            .map((member) => (
                                <MemberCard
                                    key={member.id}
                                    member={member}
                                    actions={ member.id !== user?.uid ? // Admins can't remove or promote themselves
                                    <>
                                        {member.status !== 'ADMIN' && (
                                             <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMemberAction(member.id, 'promote')}
                                                disabled={actionInProgress[member.id]}
                                            >
                                                <ShieldCheck className="h-4 w-4 mr-2" />
                                                Promover
                                            </Button>
                                        )}
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleMemberAction(member.id, 'remove')}
                                            disabled={actionInProgress[member.id]}
                                        >
                                            <UserX className="h-4 w-4 mr-2" />
                                            Remover
                                        </Button>
                                    </> : null
                                    }
                                    actionInProgress={actionInProgress[member.id]}
                                />
                            ))
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Em breve</CardTitle>
                    <CardDescription>Moderação de conteúdo denunciado pela comunidade.</CardDescription>
                </CardHeader>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
