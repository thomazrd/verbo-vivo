

"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, increment, writeBatch, deleteDoc, getDocs, where } from 'firebase/firestore';
import type { Congregation, Post, Comment } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

import { ArrowLeft, Heart, Loader2, Send, MessageCircle, UserPlus, Copy, Check, Settings, Pencil, CornerDownRight, MoreHorizontal, Trash2, PlayCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PostCard } from '@/components/community/PostCard';


function InviteModal({ inviteCode }: { inviteCode: string }) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setHasCopied(true);
        toast({ title: "Código copiado!", description: "Você pode compartilhar este código para convidar pessoas." });
        setTimeout(() => setHasCopied(false), 2000);
    }
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Convidar para a Congregação</DialogTitle>
                <DialogDescription>
                    Compartilhe este código com pessoas da sua igreja para que possam se juntar à comunidade.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <Label htmlFor="invite-code">Código de Convite</Label>
                <div className="flex items-center gap-2">
                    <Input id="invite-code" value={inviteCode} readOnly className="font-mono tracking-widest text-lg h-11" />
                    <Button onClick={handleCopy} size="icon" variant="outline" className="h-11 w-11">
                        {hasCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
            <DialogFooter>
                <DialogTrigger asChild>
                    <Button variant="outline">Fechar</Button>
                </DialogTrigger>
            </DialogFooter>
        </DialogContent>
    )
}

export default function CongregationFeedPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const congregationId = params.congregationId as string;
  
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = userProfile?.congregationStatus === 'ADMIN' && userProfile?.congregationId === congregationId;
  const isMember = userProfile?.congregationId === congregationId && (userProfile?.congregationStatus === 'MEMBER' || userProfile?.congregationStatus === 'ADMIN');

  useEffect(() => {
    if (authLoading) {
      return;
    };
  
    if (!userProfile && !authLoading) {
      setLoading(false);
      return;
    }

    if (userProfile && !isMember) {
        setError("Você não é um membro desta congregação.");
        setCongregation(null);
        setLoading(false);
        return;
    }
    
    if (isMember) {
      const congregationRef = doc(db, 'congregations', congregationId);
      
      const unsubscribeCongregation = onSnapshot(congregationRef, async (congDoc) => {
        if (congDoc.exists()) {
            setCongregation({ id: congDoc.id, ...congDoc.data() } as Congregation);
            setError(null);

            const postsQuery = query(
              collection(db, "congregations", congregationId, "posts"),
              orderBy("createdAt", "desc")
            );
            
            const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
              const congregationPosts: Post[] = [];
              snapshot.forEach((doc) => {
                congregationPosts.push({ id: doc.id, ...doc.data() } as Post);
              });
              setPosts(congregationPosts);
              setLoading(false);
            }, (err) => {
                console.error("Error fetching posts:", err);
                setError("Falha ao carregar as publicações.");
                setLoading(false);
            });
            
            return () => unsubscribePosts();
        } else {
          setError("Congregação não encontrada.");
          setCongregation(null);
          setLoading(false);
        }
      }, (err) => {
          console.error("Error fetching congregation:", err);
          setError("Falha ao carregar a congregação.");
          setLoading(false);
      });

      return () => {
        unsubscribeCongregation();
      };
    } else {
        setLoading(false);
    }
  }, [userProfile, authLoading, congregationId, isMember]);
  
  useEffect(() => {
      // Scroll to top when new posts are added (simple approach)
      if (posts.length > 0 && listRef.current) {
        // A conditional check to prevent this from firing on initial load might be needed
        // For now, this is simple and effective.
      }
  }, [posts.length > 0 ? posts[0].id : null]);

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;
    const postRef = doc(db, 'congregations', congregationId, 'posts', postId);
    try {
        await updateDoc(postRef, {
            likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
            likeCount: increment(hasLiked ? -1 : 1),
        });
    } catch (error) {
      console.error("Error updating like status:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar sua interação." });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-xl mx-auto py-8 px-0 sm:px-4 space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-2xl py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive">{error}</h2>
        <Button asChild variant="link" className="mt-4"><Link href="/community">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <>
    <div className="flex h-full flex-col">
        <div className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2 sm:gap-4 max-w-5xl mx-auto">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/community')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">{congregation?.name}</h1>
                    <p className="text-sm text-muted-foreground">{congregation?.memberCount} membro(s)</p>
                </div>
                {congregation && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="shrink-0">
                                <UserPlus className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Convidar</span>
                            </Button>
                        </DialogTrigger>
                        <InviteModal inviteCode={congregation.inviteCode} />
                    </Dialog>
                )}
                 {isAdmin && (
                    <Button variant="secondary" size="sm" className="shrink-0" onClick={() => router.push(`/community/${congregationId}/manage`)}>
                        <Settings className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Gerenciar</span>
                    </Button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30" ref={listRef}>
            <div className="mx-auto max-w-xl w-full">
                {user && congregationId && (
                    <CreatePostForm
                        user={user}
                        congregationId={congregationId}
                        className="sm:mt-4"
                    />
                )}

                {posts.length === 0 && !user ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Carregando publicações...</p>
                    </div>
                ) : posts.length === 0 ? (
                     <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
                        <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} congregationId={congregationId} onLike={handleLike} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
    </>
  );
}
