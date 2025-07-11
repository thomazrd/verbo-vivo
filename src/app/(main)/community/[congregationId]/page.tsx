


"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, increment, writeBatch, deleteDoc, getDocs, where } from 'firebase/firestore';
import type { Congregation, Post, Comment, TextContent, ImageContent, BackgroundTextContent, VideoContent } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

import { ArrowLeft, Heart, Loader2, Send, MessageCircle, UserPlus, Copy, Check, Settings, Pencil, CornerDownRight, MoreHorizontal, Trash2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


function CommentWithReplies({ comment, allComments, congregationId, postId, postAuthorId, onCommentSubmit }: { 
    comment: Comment, 
    allComments: Comment[], 
    congregationId: string, 
    postId: string,
    postAuthorId: string,
    onCommentSubmit: () => void,
}) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isReplying, setIsReplying] = useState(false);
    const [newReply, setNewReply] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [timeAgo, setTimeAgo] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(comment.text);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

    const replies = allComments.filter(c => c.parentCommentId === comment.id);

    useEffect(() => {
        if (comment.createdAt) {
          setTimeAgo(formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: ptBR }));
        }
    }, [comment.createdAt]);
    
    if (!user) return null;
    const currentUserInitial = user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?');

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim()) return;
        setIsSubmittingReply(true);
        try {
            const batch = writeBatch(db);
            const commentsCollectionRef = collection(db, 'congregations', congregationId, 'posts', postId, 'comments');
            const postRef = doc(db, 'congregations', congregationId, 'posts', postId);
            const parentCommentRef = doc(db, 'congregations', congregationId, 'posts', postId, 'comments', comment.id);

            const newReplyRef = doc(commentsCollectionRef);
            batch.set(newReplyRef, {
                authorId: user.uid,
                authorName: user.displayName || user.email,
                authorPhotoURL: user.photoURL,
                text: newReply,
                parentCommentId: comment.id,
                createdAt: serverTimestamp(),
                replyCount: 0,
            });

            batch.update(postRef, { commentCount: increment(1) });
            batch.update(parentCommentRef, { replyCount: increment(1) });
            
            await batch.commit();

            setNewReply("");
            setIsReplying(false);
            onCommentSubmit();

        } catch (error) {
            console.error("Error adding reply:", error);
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Não foi possível adicionar a sua resposta.",
            });
        } finally {
            setIsSubmittingReply(false);
        }
    };
    
    const handleEditSubmit = async () => {
        if (!editedText.trim() || editedText === comment.text) {
            setIsEditing(false);
            return;
        }
        setIsSubmittingEdit(true);
        try {
            const commentRef = doc(db, 'congregations', congregationId, 'posts', postId, 'comments', comment.id);
            await updateDoc(commentRef, {
                text: editedText,
            });
            setIsEditing(false);
            onCommentSubmit();
        } catch (error) {
            console.error("Error editing comment:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a alteração.' });
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleDeleteComment = async () => {
        try {
            const batch = writeBatch(db);
            const postRef = doc(db, 'congregations', congregationId, 'posts', postId);
            const commentRef = doc(db, 'congregations', congregationId, 'posts', postId, 'comments', comment.id);
            
            // If it's a top-level comment, we need to delete all its replies as well
            let totalToDelete = 1;
            if (!comment.parentCommentId) {
                const repliesQuery = query(collection(db, 'congregations', congregationId, 'posts', postId, 'comments'), where('parentCommentId', '==', comment.id));
                const repliesSnapshot = await getDocs(repliesQuery);
                repliesSnapshot.forEach(replyDoc => {
                    batch.delete(replyDoc.ref);
                    totalToDelete++;
                });
            } else {
                 // If it's a reply, decrement the parent's replyCount
                 const parentCommentRef = doc(db, 'congregations', congregationId, 'posts', postId, 'comments', comment.parentCommentId);
                 batch.update(parentCommentRef, { replyCount: increment(-1) });
            }

            batch.delete(commentRef);
            batch.update(postRef, { commentCount: increment(-totalToDelete) });
            
            await batch.commit();
            onCommentSubmit();
            toast({ title: "Comentário excluído." });
        } catch (error) {
            console.error("Error deleting comment:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o comentário.' });
        }
    };


    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3 group">
              <Avatar className="h-8 w-8 border text-xs">
                {comment.authorPhotoURL && <AvatarImage src={comment.authorPhotoURL} alt={comment.authorName} />}
                <AvatarFallback className="bg-muted-foreground/10">{comment.authorName?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                {isEditing ? (
                    <div className="space-y-2">
                        <Textarea 
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="text-sm"
                            disabled={isSubmittingEdit}
                        />
                        <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button size="sm" onClick={handleEditSubmit} disabled={isSubmittingEdit}>
                                {isSubmittingEdit ? <Loader2 className="h-4 w-4 animate-spin"/> : "Salvar"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex items-baseline justify-between">
                            <div className="flex items-center gap-2">
                            <p className="font-semibold text-xs">{comment.authorName}</p>
                            {comment.authorId === postAuthorId && (
                                <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">Autor</span>
                            )}
                            </div>
                        {timeAgo && 
                            <p className="text-xs text-muted-foreground" title={comment.createdAt?.toDate().toLocaleString('pt-BR')}>
                                {timeAgo}
                            </p>
                        }
                        </div>
                        <p className="text-sm text-card-foreground">{comment.text}</p>
                        <button 
                            className="text-xs font-semibold text-muted-foreground hover:text-primary mt-1"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            Responder
                        </button>
                    </div>
                )}
              </div>
              {user.uid === comment.authorId && !isEditing && (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setIsEditing(true)}>
                              <Pencil className="mr-2 h-4 w-4"/>
                              Editar
                          </DropdownMenuItem>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="mr-2 h-4 w-4 text-destructive"/>
                                        <span className="text-destructive">Excluir</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Comentário?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o seu comentário e todas as suas respostas.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteComment} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                      </DropdownMenuContent>
                  </DropdownMenu>
              )}
            </div>

            {isReplying && (
                <form onSubmit={handleReplySubmit} className="flex items-start gap-3 pl-11 pt-2">
                    <Avatar className="h-8 w-8 border">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ""} />}
                        <AvatarFallback className="bg-muted-foreground/10">{currentUserInitial}</AvatarFallback>
                    </Avatar>
                    <div className="relative flex-1">
                        <Textarea
                          placeholder={`Respondendo a ${comment.authorName}...`}
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          className="min-h-[40px] resize-none pr-10 text-sm"
                          rows={1}
                          disabled={isSubmittingReply}
                        />
                        <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" disabled={!newReply.trim() || isSubmittingReply}>
                            {isSubmittingReply ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        </Button>
                    </div>
                </form>
            )}

            {replies.length > 0 && (
                <div className="pl-6 border-l-2 border-muted-foreground/20 ml-4 space-y-2">
                    {replies.map(reply => (
                         <CommentWithReplies 
                            key={reply.id}
                            comment={reply}
                            allComments={allComments}
                            congregationId={congregationId}
                            postId={postId}
                            postAuthorId={postAuthorId}
                            onCommentSubmit={onCommentSubmit}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}


function PostCard({ post, congregationId, onLike }: { post: Post, congregationId: string, onLike: (postId: string, hasLiked: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const topLevelComments = comments.filter(c => !c.parentCommentId);

  useEffect(() => {
    if (post.createdAt) {
      setTimeAgo(formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ptBR }));
    }
  }, [post.createdAt]);

  const fetchComments = () => {
    setLoadingComments(true);
    const commentsQuery = query(
      collection(db, "congregations", congregationId, "posts", post.id, "comments"),
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
    return unsubscribe;
  }

  useEffect(() => {
    if (!showComments) return;
    const unsubscribe = fetchComments();
    return () => unsubscribe();
  }, [post.id, showComments, toast, congregationId]);
  
  const handleAddComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !newComment.trim()) return;
      setIsSubmittingComment(true);
      try {
          const commentCollectionRef = collection(db, 'congregations', congregationId, 'posts', post.id, 'comments');
          const postRef = doc(db, 'congregations', congregationId, 'posts', post.id);
          
          const batch = writeBatch(db);
          const newCommentRef = doc(commentCollectionRef);

          batch.set(newCommentRef, {
              authorId: user.uid,
              authorName: user.displayName || user.email,
              authorPhotoURL: user.photoURL,
              text: newComment,
              createdAt: serverTimestamp(),
              replyCount: 0,
          });

          batch.update(postRef, { commentCount: increment(1) });
          
          await batch.commit();
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

  const PostText = ({ text }: { text: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <p className="mt-1 text-card-foreground whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
                }
                return part;
            })}
        </p>
    );
  };

  if (!user) return null;

  const hasLiked = post.likes?.includes(user.uid);
  const authorInitial = post.authorName ? post.authorName[0].toUpperCase() : '?';
  const currentUserInitial = user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?');

  const renderContent = () => {
    if (!post.content) {
      return null;
    }
    
    switch (post.postType) {
      case 'IMAGE':
        const imageContent = post.content as ImageContent;
        if (!imageContent.imageUrl) {
            return (
                <div className="mt-2 text-sm text-muted-foreground italic">
                    {imageContent.text && <PostText text={imageContent.text} />}
                    Processando imagem...
                </div>
            );
        }
        return (
          <div className="mt-2 space-y-2">
            {imageContent.text && <PostText text={imageContent.text} />}
            <div className="-mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
                <Image
                src={imageContent.imageUrl}
                alt={imageContent.text || `Post by ${post.authorName}`}
                width={600}
                height={600}
                className="w-full h-auto bg-muted object-cover"
                data-ai-hint="community post"
                />
            </div>
          </div>
        );
      case 'VIDEO':
        const videoContent = post.content as VideoContent;
        if (isPlayingVideo) {
            return (
                <div className="mt-2 space-y-2">
                    {videoContent.text && <PostText text={videoContent.text} />}
                    <div className="aspect-video -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoContent.videoId}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )
        }
        return (
            <div className="mt-2 space-y-2">
                {videoContent.text && <PostText text={videoContent.text} />}
                <div 
                    className="relative -mx-4 sm:mx-0 sm:rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setIsPlayingVideo(true)}
                >
                    <Image
                        src={videoContent.thumbnailUrl || ''}
                        alt="Video thumbnail"
                        width={480}
                        height={270}
                        className="w-full h-auto bg-muted object-cover"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                        <PlayCircle className="h-16 w-16 text-white/80" />
                    </div>
                </div>
            </div>
        );
      case 'BACKGROUND_TEXT':
        const bgTextContent = post.content as BackgroundTextContent;
        const bgStyleClass = bgTextContent.backgroundStyle === 'gradient_blue'
          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
          : bgTextContent.backgroundStyle === 'gradient_green'
          ? 'bg-gradient-to-br from-green-400 to-blue-500 text-white'
          : bgTextContent.backgroundStyle === 'gradient_orange'
          ? 'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500 text-white'
          : bgTextContent.backgroundStyle === 'gradient_pink'
          ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white'
          : 'bg-muted';
        return (
          <div className={cn(
            'mt-2 h-64 flex items-center justify-center p-6 text-center rounded-lg',
            bgStyleClass
          )}>
            <p className="font-bold text-2xl">{bgTextContent.text}</p>
          </div>
        );
      case 'TEXT':
      default:
        const textContent = post.content as TextContent;
        return <PostText text={textContent.text} />;
    }
  };


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
              {timeAgo && 
                  <p className="text-xs text-muted-foreground" title={post.createdAt?.toDate().toLocaleString('pt-BR')}>
                      {timeAgo}
                  </p>
              }
          </div>
          {renderContent()}
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
          
          {!loadingComments && topLevelComments.map(comment => (
            <CommentWithReplies 
                key={comment.id}
                comment={comment}
                allComments={comments}
                congregationId={congregationId}
                postId={post.id}
                postAuthorId={post.authorId}
                onCommentSubmit={fetchComments}
            />
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
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const congregationId = params.congregationId as string;
  
  const [congregation, setCongregation] = useState<Congregation | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = userProfile?.congregationStatus === 'ADMIN' && userProfile?.congregationId === congregationId;


  useEffect(() => {
    if (!user || !congregationId) return;
    setLoading(true);
    
    const congregationRef = doc(db, 'congregations', congregationId);
    
    const unsubscribeCongregation = onSnapshot(congregationRef, async (congDoc) => {
      if (congDoc.exists()) {
        const memberRef = doc(db, 'congregations', congregationId, 'members', user.uid);
        const memberSnap = await getDoc(memberRef);

        if (memberSnap.exists() && (memberSnap.data().status === 'MEMBER' || memberSnap.data().status === 'ADMIN')) {
          setCongregation({ id: congDoc.id, ...congDoc.data() } as Congregation);
          
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
            setError(null);
            setLoading(false);
          }, (err) => {
              console.error("Error fetching posts:", err);
              setError("Falha ao carregar as publicações.");
              setLoading(false);
          });
          
          return () => unsubscribePosts();
        } else {
          setError("Você não é um membro desta congregação.");
          setCongregation(null);
          setLoading(false);
        }
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
  }, [user, congregationId]);
  
  useEffect(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [posts.length > 0 ? posts[0].id : null]);

  const handleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;
    const postRef = doc(db, 'congregations', congregationId, 'posts', postId);
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

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4 space-y-4">
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
            <div className="container mx-auto max-w-3xl flex items-center gap-4">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.push('/community')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">{congregation?.name}</h1>
                    <p className="text-sm text-muted-foreground">{congregation?.memberCount} membro(s)</p>
                </div>
                {congregation && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Convidar
                            </Button>
                        </DialogTrigger>
                        <InviteModal inviteCode={congregation.inviteCode} />
                    </Dialog>
                )}
                 {isAdmin && (
                    <Button variant="secondary" size="sm" onClick={() => router.push(`/community/${congregationId}/manage`)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                    </Button>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto" ref={listRef}>
            <div className="container mx-auto max-w-3xl py-6 px-4">
                <div className="p-4 rounded-lg bg-card border mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border">
                            {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || ''}/>}
                            <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <Button 
                            variant="outline"
                            className="w-full justify-start text-muted-foreground"
                            onClick={() => setIsPostModalOpen(true)}
                        >
                            Compartilhe algo com a congregação...
                        </Button>
                        <Button size="icon" onClick={() => setIsPostModalOpen(true)}>
                            <Pencil className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>

                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhuma publicação ainda.</p>
                        <p className="text-sm text-muted-foreground">Seja o primeiro a compartilhar!</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} congregationId={congregationId} onLike={handleLike} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
    {user && congregation && (
        <CreatePostModal 
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
            user={user}
            congregationId={congregation.id}
        />
    )}
    </>
  );
}
