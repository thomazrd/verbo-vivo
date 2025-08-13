

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, writeBatch, increment, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Congregation, CongregationMember } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ArrowLeft, Check, ShieldCheck, UserX, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberCard } from '@/components/community/MemberCard';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const congregationFormSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
});

type CongregationFormValues = z.infer<typeof congregationFormSchema>;

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
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<CongregationFormValues>({
    resolver: zodResolver(congregationFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (congregation) {
      form.reset({ name: congregation.name });
    }
  }, [congregation, form]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
        router.push('/login');
        return;
    }
    
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
            const data = { id: doc.id, ...doc.data() } as Congregation;
            setCongregation(data);
            form.setValue('name', data.name);
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
            setLoading(false);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os membros.'});
        });

        return () => {
            unsubCongregation();
            unsubMembers();
        };
    } else if (!authLoading && !userProfile) {
        router.push('/community');
    }

  }, [congregationId, router, authLoading, user, userProfile, toast, form]);

  const handleUpdateCongregation = async (values: CongregationFormValues) => {
    if (!congregationId) return;
    setIsSaving(true);
    try {
        const congRef = doc(db, 'congregations', congregationId);
        await updateDoc(congRef, { name: values.name });
        toast({ title: 'Sucesso!', description: 'O nome da congregação foi atualizado.' });
    } catch(error) {
        console.error("Error updating congregation name:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o nome.' });
    } finally {
        setIsSaving(false);
    }
  };

  const handleMemberAction = async (
    targetUserId: string, 
    action: 'approve' | 'reject' | 'promote' | 'remove' | 'leave'
  ) => {
    setActionInProgress(prev => ({ ...prev, [targetUserId]: true }));
    try {
      if (action === 'approve') {
          const functions = getFunctions();
          const approveMember = httpsCallable(functions, 'approveCongregationMemberRequest');
          await approveMember({ adminUid: user?.uid, congregationId, targetUserId });
          toast({ title: "Membro Aprovado!", description: "O usuário agora faz parte da congregação." });
      } else {
        const batch = writeBatch(db);
        const congregationRef = doc(db, 'congregations', congregationId);
        const memberRef = doc(db, 'congregations', congregationId, 'members', targetUserId);
        const userRef = doc(db, 'users', targetUserId);
  
        switch (action) {
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
              
              if(currentMember && (currentMember.status === 'MEMBER' || currentMember.status === 'ADMIN')) {
                batch.update(congregationRef, { memberCount: increment(-1) });
              }
              toast({ title: "Membro Removido." });
              break;
          case 'leave':
               const memberLeaveDoc = await getDoc(memberRef);
              if (!memberLeaveDoc.exists()) throw new Error("Member not found");
  
              batch.delete(memberRef);
              batch.update(userRef, { congregationId: null, congregationStatus: 'NONE' });
              batch.update(congregationRef, { memberCount: increment(-1) });
              toast({ title: "Você saiu da congregação." });
              router.push('/community');
              break;
        }
        
        await batch.commit();
      }

    } catch (error: any) {
      console.error(`Error performing action ${action} on user ${targetUserId}:`, error);
      const errorMessage = error.message || 'Não foi possível completar a ação. Verifique as permissões.';
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
    } finally {
      setActionInProgress(prev => ({ ...prev, [targetUserId]: false }));
    }
  };


  const pendingMembers = members.filter((m) => m.status === 'PENDING');
  const approvedMembers = members.filter((m) => m.status === 'MEMBER' || m.status === 'ADMIN');
  const currentUserIsLastAdmin = approvedMembers.filter(m => m.status === 'ADMIN').length === 1 && userProfile?.congregationStatus === 'ADMIN';

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pendentes {pendingMembers.length > 0 && `(${pendingMembers.length})`}
          </TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
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
        
        <TabsContent value="settings" className="mt-6 space-y-6">
            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateCongregation)}>
                        <CardHeader>
                            <CardTitle>Configurações Gerais</CardTitle>
                            <CardDescription>Altere as informações básicas da sua congregação.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome da Congregação</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Nome da sua igreja" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                             <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Alterações
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>Ações nesta seção são permanentes e não podem ser desfeitas.</CardDescription>
                </CardHeader>
                <CardContent>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                Sair da Congregação
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {currentUserIsLastAdmin
                                        ? "Você é o último administrador. Se sair, a congregação será permanentemente excluída. Esta ação não pode ser desfeita."
                                        : "Esta ação removerá você da congregação. Você precisará de um novo convite para entrar novamente."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => user && handleMemberAction(user.uid, 'leave')} disabled={actionInProgress[user!.uid]}>
                                    {currentUserIsLastAdmin ? "Excluir e Sair" : "Sair"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
