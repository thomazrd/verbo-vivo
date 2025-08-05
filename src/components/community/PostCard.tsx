
"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, collection, query, orderBy, addDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp, getDoc, increment, writeBatch, deleteDoc, getDocs, where } from 'firebase/firestore';
import type { Congregation, Post, Comment, TextContent, ImageContent, BackgroundTextContent, VideoContent, BibleVerseContent } from '@/lib/types';
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
import { downloadVerseImage } from '@/lib/download-verse-image';


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

    const replies = useMemo(() => allComments.filter(c => c.parentCommentId === comment.id), [allComments, comment.id]);

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
                            <p className="text-xs text-muted-foreground shrink-0 ml-2" title={comment.createdAt?.toDate().toLocaleString('pt-BR')}>
                                {timeAgo}
                            </p>
                        }
                        </div>
                        <p className="text-sm text-card-foreground break-words">{comment.text}</p>
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
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Excluir
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


export function PostCard({ post, congregationId, onLike }: { post: Post, congregationId: string, onLike: (postId: string, hasLiked: boolean) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  const topLevelComments = useMemo(() => comments.filter(c => !c.parentCommentId), [comments]);

  useEffect(() => {
    if (post.createdAt) {
      setTimeAgo(formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true, locale: ptBR }));
    }
  }, [post.createdAt]);

  const fetchComments = useCallback(() => {
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
  }, [congregationId, post.id, toast]);

  useEffect(() => {
    if (!showComments) return;
    const unsubscribe = fetchComments();
    return () => unsubscribe();
  }, [showComments, fetchComments]);
  
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
        <p className="text-card-foreground whitespace-pre-wrap break-words">
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{part}</a>;
                }
                return part;
            })}
        </p>
    );
  };
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(post.postType === 'BIBLE_VERSE') {
      const verseContent = post.content as BibleVerseContent;
      downloadVerseImage({
        reference: verseContent.reference,
        text: verseContent.text,
        version: verseContent.version,
        authorName: post.authorName,
      });
    }
  }

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
        const hasText = imageContent.text && imageContent.text.trim().length > 0;
        return (
          <>
            {hasText && (
                <div className="px-4 pt-3 pb-2">
                    <PostText text={imageContent.text} />
                </div>
            )}
            <div className="w-full bg-black">
                <Image
                src={imageContent.imageUrl}
                alt={imageContent.text || `Post by ${post.authorName}`}
                width={720}
                height={720}
                className="w-full h-auto max-h-[80vh] object-contain"
                data-ai-hint="community post"
                />
            </div>
          </>
        );
      case 'VIDEO':
        const videoContent = post.content as VideoContent;
        const hasVideoText = videoContent.text && videoContent.text.trim().length > 0;

        if (isPlayingVideo) {
            return (
                <>
                    {hasVideoText && (
                        <div className="px-4 pt-3 pb-2">
                            <PostText text={videoContent.text} />
                        </div>
                    )}
                    <div className="aspect-video w-full">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoContent.videoId}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </>
            )
        }
        return (
            <>
                {hasVideoText && (
                    <div className="px-4 pt-3 pb-2">
                        <PostText text={videoContent.text} />
                    </div>
                )}
                <div 
                    className="relative w-full bg-black cursor-pointer group"
                    onClick={() => setIsPlayingVideo(true)}
                >
                    <Image
                        src={videoContent.thumbnailUrl || ''}
                        alt="Video thumbnail"
                        width={480}
                        height={270}
                        className="w-full h-auto object-contain"
                        unoptimized={true}
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100">
                        <PlayCircle className="h-16 w-16 text-white/80" />
                    </div>
                </div>
            </>
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
            'h-80 flex items-center justify-center p-6 text-center',
            bgStyleClass
          )}>
            <p className="font-bold text-3xl break-words">{bgTextContent.text}</p>
          </div>
        );
      case 'BIBLE_VERSE':
        const verseContent = post.content as BibleVerseContent;
        return (
            <div 
                className="bg-cover bg-center text-white p-8 min-h-[250px] flex flex-col justify-center items-center text-center relative"
                style={{backgroundImage: 'url(https://dynamic.tiggomark.com.br/images/paper_texture.jpg)'}}
            >
                <div className="absolute inset-0 bg-primary/80 backdrop-blur-[1px]"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <Image
                      src="https://dynamic.tiggomark.com.br/images/logo_branca.png" 
                      alt="Verbo Vivo Icon"
                      width={64}
                      height={64}
                      className="opacity-80 mb-4"
                    />
                    <blockquote className="font-serif italic text-2xl md:text-3xl text-shadow-md">
                        “{verseContent.text}”
                    </blockquote>
                    <p className="mt-4 font-semibold text-lg text-shadow-sm opacity-90">
                        — {verseContent.reference} ({verseContent.version})
                    </p>
                </div>
            </div>
        );
      case 'TEXT':
      default:
        const textContent = post.content as TextContent;
        return (
            <div className="px-4 pt-3 pb-2">
                 <PostText text={textContent.text} />
            </div>
        );
    }
  };


  return (
    <div className="bg-card border-b sm:border sm:rounded-lg overflow-hidden">
      <div className="p-4">
          <div className="flex gap-3 sm:gap-4">
            <Avatar className="h-10 w-10 border">
              {post.authorPhotoURL && <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />}
              <AvatarFallback className="bg-muted">{authorInitial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-sm truncate">{post.authorName}</p>
                 {timeAgo && 
                  <p className="text-xs text-muted-foreground" title={post.createdAt?.toDate().toLocaleString('pt-BR')}>
                      {timeAgo}
                  </p>
              }
            </div>
          </div>
      </div>
      
      {renderContent()}

      <div className="px-4 py-2">
          <div className="flex items-center justify-between text-muted-foreground">
                {post.likeCount > 0 && <span className="text-xs">{post.likeCount} curtida(s)</span>}
                {post.commentCount > 0 && <span className="text-xs ml-auto">{post.commentCount} comentário(s)</span>}
          </div>
          <div className="mt-1 flex items-center gap-1 border-t pt-1">
              <Button
                  variant="ghost"
                  size="sm"
                  className={cn("w-full gap-2 h-8", hasLiked && "text-destructive")}
                  onClick={() => onLike(post.id, !!hasLiked)}
              >
                  <Heart className={cn("h-4 w-4", hasLiked && "fill-destructive")} />
                  <span className="font-semibold">Curtir</span>
              </Button>
               <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 h-8"
                  onClick={() => setShowComments(s => !s)}
              >
                  <MessageCircle className="h-4 w-4"/>
                  <span className="font-semibold">Comentar</span>
              </Button>
              {post.postType === 'BIBLE_VERSE' && (
                <Button variant="ghost" size="sm" className="w-full gap-2 h-8" onClick={handleDownload}>
                  <Download className="h-4 w-4"/>
                  <span className="font-semibold">Baixar</span>
                </Button>
              )}
          </div>
      </div>
       {showComments && (
        <div className="p-4 pt-2 border-t border-muted/50 space-y-4">
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

    