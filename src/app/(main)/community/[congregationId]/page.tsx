"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, where, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import type { Congregation, Post, Comment } from '@/lib/types';
import Link from 'next/link';

import { ArrowLeft, Heart, HeartHandshake, Loader2, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function PostCard({ post, onLike }: { post: Post, onLike: (postId: string, hasLiked: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!showComments) return;

    setLoadingComments(true);
    const commentsQuery = query(
      collection(db, "congregationPosts", post.id, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const postComments: Comment[] = [];
      snapshot.forEach((doc) => {
        postComments.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(postComments);
      setLoadingComments(false);
    }, (error) => {
        console.error("Error fetching comments:", error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os comentários.' });
        setLoadingComments(false);
    });

    return () => unsubscribe();
  }, [post.id, showComments, toast]);
  
  const handleAddComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newComment.trim()) return;
      setIsSubmittingComment(true);
      try {
          await addDoc(collection(db, 'congregationPosts', post.id, 'comments'), {
              authorId: user.uid,
              authorName: user.displayName || user.email,
              authorPhotoURL: user.photoURL,
              text: newComment,
              createdAt: serverTimestamp()
          });
          setNewComment("");
      } catch (error) {
          console.error("Error adding comment:", error);
          toast({
              variant: "destructive",
              title: "Erro",
              description: "Não foi possível adicionar o seu comentário.",
          });
      } finally {
          setIsSubmittingComment(false);
      }
  }

  if (!user) return null;

  const hasLiked = post.likes?.includes(user.uid);
  const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : '?';
  const currentUserInitial = user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?');

  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg bg-card border">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border">
          {post.authorPhotoURL && <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />}
          <AvatarFallback className="bg-muted">{authorInitial}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{post.authorName}</p>
              {post.createdAt && 
                  <p className="text-xs text-muted-foreground" title={post.createdAt.toDate().toLocaleString('pt-BR')}>
                      {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                  </p>
              }
          </div>
          <p className="mt-1 text-card-foreground whitespace-pre-wrap">{post.text}</p>
          <div className="mt-3 flex items-center gap-4 text-muted-foreground">
              <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-2 h-8 px-2", hasLiked && "text-destructive")}
                  onClick={() => onLike(post.id, !!hasLiked)}
              >
                  <Heart className={cn("h-4 w-4", hasLiked && "fill-destructive")} />
                  {post.likeCount > 0 && <span>{post.likeCount}</span>}
              </Button>
               <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 h-8 px-2"
                  onClick={() => setShowComments(s => !s)}
              >
                  <MessageCircle className="h-4 w-4"/>
                  {post.commentCount > 0 && <span>{post.commentCount}</span>}
              </Button>
          </div>
        </div>
      </div>
       {showComments && (
        <div className="pt-4 border-t border-muted/50 ml-14 space-y-4">
          {loadingComments && <Skeleton className="h-10 w-full" />}
          {!loadingComments && comments.map(comment => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border text-xs">
                {comment.authorPhotoURL && <AvatarImage src={comment.authorPhotoURL} alt={comment.authorName} />}
                <AvatarFallback className="bg-muted-foreground/10">{comment.authorName?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-xs">{comment.authorName}</p>
                  {comment.createdAt && 
                      <p className="text-xs text-muted-foreground" title={comment.createdAt.toDate().toLocaleString('pt-BR')}>
                          {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR })}
                      </p>
                  }
                </div>
                <p className="text-sm text-card-foreground">{comment.text}</p>
              </div>
            </div>
          ))}
          {!loadingComments && comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">Seja o primeiro a comentar.</p>
          )}

          <form onSubmit={handleAddComment} className="flex items-start gap-3 pt-2">
            <Avatar className="h-8 w-8 border">
                {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ""} />}
                <AvatarFallback className="bg-muted-foreground/10">{currentUserInitial}</AvatarFallback>
            </Avatar>
            <div className="relative flex-1">
                <Textarea
                  placeholder="Escreva um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[40px] resize-none pr-10 text-sm"
                  rows={1}
                  disabled={isSubmittingComment}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={!newComment.trim() || isSubmittingComment}>
                    {isSubmittingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
            </div>
          </form>
        </div>
      )}
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

export default function CongregationFeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const congregationId = params.congregationId as string;
  
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !congregationId) return;
    setLoading(true);
    
    const congregationRef = doc(db, 'congregations', congregationId);
    const unsubscribeCongregation = onSnapshot(congregationRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().members[user.uid]) {
        setCongregation({ id: docSnap.id, ...docSnap.data() } as Congregation);
      } else {
        setError("Congregação não encontrada ou você não é um membro.");
        setCongregation(null);
      }
    }, (err) => {
        console.error("Error fetching congregation:", err);
        setError("Falha ao carregar a congregação.");
        setLoading(false);
    });
    
    const postsQuery = query(
      collection(db, "congregationPosts"),
      where("congregationId", "==", congregationId),
      orderBy("createdAt", "desc")
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      const congregationPosts: Post[] = [];
      snapshot.forEach((doc) => {
        congregationPosts.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(congregationPosts);
      setLoading(false);
    });

    return () => {
      unsubscribeCongregation();
      unsubscribePosts();
    };
  }, [user, congregationId]);
  
  useEffect(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [posts.length]);

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;
    const postRef = doc(db, 'congregationPosts', postId);
    try {
        if (hasLiked) {
            await updateDoc(postRef, {
                likes: arrayRemove(user.uid),
                likeCount: (posts.find(p => p.id === postId)?.likeCount || 1) - 1,
            });
        } else {
            await updateDoc(postRef, {
                likes: arrayUnion(user.uid),
                likeCount: (posts.find(p => p.id === postId)?.likeCount || 0) + 1,
            });
        }
    } catch (error) {
      console.error("Error updating like status:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível registrar sua interação." });
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newPost.trim() || !congregation) return;
      setIsSubmitting(true);
      try {
          await addDoc(collection(db, "congregationPosts"), {
              congregationId,
              authorId: user.uid,
              authorName: user.displayName || user.email,
              authorPhotoURL: user.photoURL,
              text: newPost,
              type: 'POST',
              likeCount: 0,
              commentCount: 0,
              createdAt: serverTimestamp(),
              likes: [],
          });
          setNewPost("");
      } catch(error) {
          console.error("Error adding post:", error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível adicionar a sua publicação." });
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
        <Button asChild variant="link" className="mt-4"><Link href="/community">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
        <div className="p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto max-w-3xl flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/community')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{congregation?.name}</h1>
                    <p className="text-sm text-muted-foreground">{congregation?.memberCount} membro(s)</p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto" ref={listRef}>
            <div className="container mx-auto max-w-3xl py-6 px-4">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
                        <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} onLike={handleLike} />
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="border-t p-4 bg-background/80 backdrop-blur-sm">
            <div className="container mx-auto max-w-3xl">
                <form onSubmit={handleAddPost} className="relative flex items-center">
                    <Textarea 
                      placeholder="Compartilhe algo com a congregação..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[48px] resize-none pr-12"
                      rows={1}
                      disabled={isSubmitting}
                    />
                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={!newPost.trim() || isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
                {congregation && congregation.admins[user?.uid ?? ''] && <InviteCodeDisplay inviteCode={congregation.inviteCode} />}
            </div>
        </div>
    </div>
  );
}
