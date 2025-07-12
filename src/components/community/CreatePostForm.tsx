

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from 'next/image';
import type { User } from "firebase/auth";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { PostType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Image as ImageIcon, Palette, X, Youtube } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";

interface CreatePostFormProps {
  user: User;
  congregationId: string;
  className?: string;
}

interface YoutubeVideoInfo {
  id: string;
  url: string;
  thumbnail: string;
}

const backgroundStyles = [
  { id: 'gradient_blue', class: 'bg-gradient-to-br from-blue-500 to-purple-600' },
  { id: 'gradient_green', class: 'bg-gradient-to-br from-green-400 to-blue-500' },
  { id: 'gradient_orange', class: 'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500' },
  { id: 'gradient_pink', class: 'bg-gradient-to-br from-pink-500 to-purple-600' },
];

function getYoutubeVideoId(url: string): string | null {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function CreatePostForm({ user, congregationId, className }: CreatePostFormProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [postType, setPostType] = useState<PostType>('TEXT');
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [youtubeVideo, setYoutubeVideo] = useState<YoutubeVideoInfo | null>(null);
  const [useYoutubeThumbnail, setUseYoutubeThumbnail] = useState(true);
  const [backgroundStyle, setBackgroundStyle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const clearMedia = useCallback(() => {
    setMediaFile(null);
    if(mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }, [mediaPreview]);

  const clearYoutube = useCallback(() => {
    setYoutubeVideo(null);
    setUseYoutubeThumbnail(true);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    if (youtubeVideo || postType !== 'TEXT') return;

    const videoId = getYoutubeVideoId(newText);
    if (videoId) {
        setYoutubeVideo({
            id: videoId,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
        });
        setPostType('VIDEO');
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor, selecione um arquivo de imagem.' });
        return;
      }
      clearYoutube();
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setPostType('IMAGE');
      setBackgroundStyle('');
    }
  };
  
  const handleSelectBg = (styleId: string) => {
    clearYoutube();
    setBackgroundStyle(styleId);
    setPostType('BACKGROUND_TEXT');
    clearMedia();
  }
  
  const handleResetType = () => {
    setPostType('TEXT');
    setBackgroundStyle('');
    clearMedia();
    clearYoutube();
  }

  const resetForm = useCallback(() => {
    setText('');
    handleResetType();
    setIsUploading(false);
    setIsExpanded(false);
  }, [handleResetType]);

  const handleSubmit = async () => {
    if (!text.trim() && !mediaFile && !youtubeVideo) {
        toast({ variant: 'destructive', title: 'Publicação vazia', description: 'Escreva algo ou adicione uma mídia.' });
        return;
    }
    setIsUploading(true);

    let finalPostType = postType;
    if (youtubeVideo && !useYoutubeThumbnail) {
        finalPostType = 'TEXT';
    }

    try {
        let content: any = { text: text || '' };

        if (finalPostType === 'VIDEO' && youtubeVideo) {
            content.videoId = youtubeVideo.id;
            content.videoUrl = youtubeVideo.url;
            content.thumbnailUrl = youtubeVideo.thumbnail;
        } else if (finalPostType === 'BACKGROUND_TEXT') {
            content.backgroundStyle = backgroundStyle || null;
        }

        const postCollectionRef = collection(db, 'congregations', congregationId, 'posts');
        const postDoc = await addDoc(postCollectionRef, {
            authorId: user.uid,
            authorName: user.displayName || user.email,
            authorPhotoURL: user.photoURL,
            postType: finalPostType,
            content,
            likeCount: 0,
            commentCount: 0,
            likes: [],
            createdAt: serverTimestamp(),
        });
        const postId = postDoc.id;

        if (finalPostType === 'IMAGE' && mediaFile) {
            const storagePath = `media/${congregationId}/${user.uid}/${postId}/${mediaFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, mediaFile);
            const downloadURL = await getDownloadURL(storageRef);

            await updateDoc(postDoc, {
                'content.imageUrl': downloadURL,
                'content.thumbnailUrl': downloadURL
            });
        }
        
        toast({ title: 'Sucesso!', description: 'Sua publicação foi compartilhada.' });
        resetForm();

    } catch (error) {
        console.error('Error creating post:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível compartilhar sua publicação.' });
    } finally {
        setIsUploading(false);
    }
  };
  
  const handleExpand = () => {
      if (!isExpanded) {
          setIsExpanded(true);
      }
  }

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        if (text || mediaFile || backgroundStyle) {
            return;
        }
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formRef, text, mediaFile, backgroundStyle]);

  const currentBgClass = backgroundStyles.find(bg => bg.id === backgroundStyle)?.class || 'bg-background';
  const currentBgId = backgroundStyles.find(bg => bg.id === backgroundStyle)?.id || '';

  if (!isExpanded) {
    return (
      <div className={cn("p-4", className)} onClick={handleExpand}>
        <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''}/>
                <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-muted-foreground cursor-text">
                Compartilhe algo com a congregação...
            </div>
            <Button size="icon" variant="ghost">
                <ImageIcon className="h-5 w-5 text-green-500"/>
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className={cn("p-4 border-b flex flex-col gap-4", className)}>
        <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10 border">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                <AvatarFallback>{user.displayName?.[0].toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder={postType === 'BACKGROUND_TEXT' ? 'Escreva algo impactante...' : 'No que você está pensando?'}
                  value={text}
                  onChange={handleTextChange}
                  className={cn(
                      "min-h-[100px] resize-none text-base border-none focus-visible:ring-0 !p-0 shadow-none bg-transparent",
                      postType === 'BACKGROUND_TEXT' && `min-h-[180px] text-center text-2xl font-bold flex items-center justify-center p-4 rounded-lg text-white ${currentBgClass}`
                  )}
                />
            </div>
        </div>
        
        {(mediaPreview || (youtubeVideo && useYoutubeThumbnail)) && (
            <div className="relative rounded-lg overflow-hidden border">
                <Image
                  src={mediaPreview || youtubeVideo!.thumbnail}
                  alt="Pré-visualização da mídia"
                  width={480}
                  height={270}
                  unoptimized={true}
                  className="w-full h-auto object-cover bg-muted"
                  data-ai-hint="user uploaded image"
                />
                <Button 
                    variant="destructive" size="icon" 
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={handleResetType}>
                    <X className="h-4 w-4"/>
                </Button>
                 {youtubeVideo && (
                     <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex items-center justify-between gap-2 text-white">
                         <div className="flex items-center gap-2 min-w-0">
                            <Youtube className="h-5 w-5 text-red-500 shrink-0" />
                            <p className="text-xs font-semibold truncate">Anexar vídeo do YouTube</p>
                         </div>
                         <div className="flex items-center gap-2">
                           <Label htmlFor="youtube-switch" className="text-xs">Anexar</Label>
                           <Switch id="youtube-switch" checked={useYoutubeThumbnail} onCheckedChange={setUseYoutubeThumbnail} />
                         </div>
                     </div>
                 )}
            </div>
        )}
        
        <div className="p-2 border rounded-lg flex items-center flex-wrap gap-2">
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
             <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Adicionar Imagem">
                <ImageIcon className="h-5 w-5 text-green-500" />
             </Button>
             <Button variant="ghost" size="icon" onClick={() => handleSelectBg(currentBgId ? '' : 'gradient_blue')} title="Fundo Colorido">
                <Palette className="h-5 w-5 text-blue-500" />
             </Button>
             <div className="flex-1" />
             {postType === 'BACKGROUND_TEXT' && backgroundStyles.map(bg => (
                 <button
                    key={bg.id}
                    className={cn("h-6 w-6 rounded-full", bg.class, backgroundStyle === bg.id && "ring-2 ring-offset-2 ring-primary")}
                    onClick={() => handleSelectBg(bg.id)}
                 />
             ))}
        </div>

        <Button onClick={handleSubmit} disabled={isUploading} className="w-full">
            {isUploading ? <Loader2 className="animate-spin" /> : 'Publicar'}
        </Button>
    </div>
  );
}
