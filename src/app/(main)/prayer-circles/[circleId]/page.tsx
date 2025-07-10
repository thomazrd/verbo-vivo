
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, where, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import type { PrayerCircle, PrayerRequest } from '@/lib/types';
import Link from 'next/link';

import { ArrowLeft, HeartHandshake, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


function PrayerRequestCard({ request, onPray, currentUserId }: { request: PrayerRequest, onPray: (requestId: string, hasPrayed: boolean) => void, currentUserId: string }) {
  const hasPrayed = request.prayingUsers.includes(currentUserId);
  const authorInitial = request.authorName ? request.authorName[0].toUpperCase() : '?';

  return (
    <div className="flex gap-4 p-4 rounded-lg bg-card border">
      <Avatar className="h-10 w-10 border">
        <AvatarFallback className="bg-muted">{authorInitial}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">{request.authorName}</p>
            <p className="text-xs text-muted-foreground">
                {request.createdAt?.toDate().toLocaleDateString('pt-BR')}
            </p>
        </div>
        <p className="mt-1 text-card-foreground whitespace-pre-wrap">{request.text}</p>
        <div className="mt-3 flex items-center justify-between text-muted-foreground">
            <Button
                variant={hasPrayed ? "default" : "outline"}
                size="sm"
                className="gap-2 h-8"
                onClick={() => onPray(request.id, hasPrayed)}
            >
                <HeartHandshake className="h-4 w-4" />
                {hasPrayed ? "Orando" : "Estou orando"}
            </Button>
            {request.prayingUsers.length > 0 && (
                <span className="text-xs">{request.prayingUsers.length} pessoa(s) orando</span>
            )}
        </div>
      </div>
    </div>
  )
}

function InviteCodeDisplay({ inviteCode }: { inviteCode: string }) {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        toast({ title: "Código copiado!", description: "Você pode compartilhar este código para convidar pessoas." });
    }
    return (
        <div className="mt-4 p-3 rounded-lg bg-muted/70 flex items-center justify-between">
            <div>
                <p className="text-sm font-semibold">Código de Convite</p>
                <p className="text-2xl font-mono tracking-widest">{inviteCode}</p>
            </div>
            <Button onClick={handleCopy} variant="ghost" size="sm">Copiar</Button>
        </div>
    )
}

export default function CircleDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const circleId = params.circleId as string;
  
  const [circle, setCircle] = useState<PrayerCircle | null>(null);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [newRequest, setNewRequest] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !circleId) return;
    setLoading(true);
    
    const circleRef = doc(db, 'prayerCircles', circleId);
    const unsubscribeCircle = onSnapshot(circleRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().members.includes(user.uid)) {
        setCircle({ id: docSnap.id, ...docSnap.data() } as PrayerCircle);
      } else {
        setError("Círculo não encontrado ou você não é um membro.");
        setCircle(null);
      }
      // Don't stop loading until requests are also loaded
    }, (err) => {
        console.error("Error fetching circle:", err);
        setError("Falha ao carregar o círculo.");
        setLoading(false);
    });
    
    const requestsQuery = query(
      collection(db, "prayerRequests"),
      where("circleId", "==", circleId),
      orderBy("createdAt", "desc")
    );
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const circleRequests: PrayerRequest[] = [];
      snapshot.forEach((doc) => {
        circleRequests.push({ id: doc.id, ...doc.data() } as PrayerRequest);
      });
      setRequests(circleRequests);
      setLoading(false);
    });

    return () => {
      unsubscribeCircle();
      unsubscribeRequests();
    };
  }, [user, circleId]);
  
  useEffect(() => {
      // Smooth scroll to top when new request is added
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [requests.length]);

  const handlePray = async (requestId: string, hasPrayed: boolean) => {
    if (!user) return;
    const requestRef = doc(db, 'prayerRequests', requestId);
    try {
      await updateDoc(requestRef, {
        prayingUsers: hasPrayed ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      console.error("Error updating prayer status:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar sua oração." });
    }
  };

  const handleAddRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newRequest.trim() || !circle) return;
      setIsSubmitting(true);
      try {
          await addDoc(collection(db, "prayerRequests"), {
              circleId,
              authorId: user.uid,
              authorName: user.displayName || user.email,
              text: newRequest,
              prayingUsers: [],
              createdAt: serverTimestamp(),
          });
          setNewRequest("");
      } catch(error) {
          console.error("Error adding prayer request:", error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar o seu pedido." });
      } finally {
          setIsSubmitting(false);
      }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
        <Button asChild variant="link" className="mt-4"><Link href="/prayer-circles">Voltar para Círculos</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
        <div className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto max-w-3xl flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/prayer-circles')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{circle?.name}</h1>
                    <p className="text-sm text-muted-foreground">{circle?.members.length} membro(s)</p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto" ref={listRef}>
            <div className="container mx-auto max-w-3xl py-6 px-4">
                {requests.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum pedido de oração ainda.</p>
                        <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {requests.map(req => (
                            <PrayerRequestCard key={req.id} request={req} onPray={handlePray} currentUserId={user!.uid} />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto max-w-3xl">
                <form onSubmit={handleAddRequest} className="relative flex items-center">
                    <Textarea 
                      placeholder="Escreva seu pedido de oração..."
                      value={newRequest}
                      onChange={(e) => setNewRequest(e.target.value)}
                      className="min-h-[48px] resize-none pr-12"
                      rows={1}
                      disabled={isSubmitting}
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={!newRequest.trim() || isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
                {circle && <InviteCodeDisplay inviteCode={circle.inviteCode} />}
            </div>
        </div>
    </div>
  );
}

    