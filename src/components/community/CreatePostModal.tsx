
"use client";

import { useState, useRef } from "react";
import Image from 'next/image';
import type { User } from "firebase/auth";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { PostType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Image as ImageIcon, Palette, X } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  congregationId: string;
}

const backgroundStyles = [
  { id: 'gradient_blue', class: 'bg-gradient-to-br from-blue-500 to-purple-600' },
  { id: 'gradient_green', class: 'bg-gradient-to-br from-green-400 to-blue-500' },
  { id: 'gradient_orange', class: 'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500' },
  { id: 'gradient_pink', class: 'bg-gradient-to-br from-pink-500 to-purple-600' },
];

export function CreatePostModal({ isOpen, onClose, user, congregationId }: CreatePostModalProps) {
  const { toast } = useToast();
  const [postType, setPostType] = useState<PostType>('TEXT');
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [backgroundStyle, setBackgroundStyle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Por favor, selecione um arquivo de imagem.' });
        return;
      }
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setPostType('IMAGE');
      setBackgroundStyle('');
    }
  };
  
  const handleSelectBg = (styleId: string) => {
    setBackgroundStyle(styleId);
    setPostType('BACKGROUND_TEXT');
    clearMedia();
  }
  
  const handleSelectText = () => {
    setPostType('TEXT');
    setBackgroundStyle('');
    clearMedia();
  }

  const clearMedia = () => {
    setMediaFile(null);
    if(mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const resetForm = () => {
    setText('');
    clearMedia();
    setBackgroundStyle('');
    setPostType('TEXT');
    setIsUploading(false);
  }

  const handleClose = () => {
    resetForm();
    onClose();
  }

  const handleSubmit = async () => {
    if (!text.trim() && !mediaFile) {
        toast({ variant: 'destructive', title: 'Publicação vazia', description: 'Escreva algo ou adicione uma mídia.' });
        return;
    }
    setIsUploading(true);

    try {
        // 1. Create post document in Firestore
        const postCollectionRef = collection(db, 'congregations', congregationId, 'posts');
        const postDoc = await addDoc(postCollectionRef, {
            authorId: user.uid,
            authorName: user.displayName || user.email,
            authorPhotoURL: user.photoURL,
            postType,
            content: { text: text || '', backgroundStyle: backgroundStyle || null }, // Initial content
            likeCount: 0,
            commentCount: 0,
            likes: [],
            createdAt: serverTimestamp(),
        });
        const postId = postDoc.id;

        // 2. Upload media if it exists
        if (postType === 'IMAGE' && mediaFile) {
            const storagePath = `media/${congregationId}/${user.uid}/${postId}/${mediaFile.name}`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, mediaFile);
            const downloadURL = await getDownloadURL(storageRef);

            // 3. Update post document with media URL
            // A Cloud Function seria ideal para gerar thumbnails
            await updateDoc(postDoc, {
                'content.imageUrl': downloadURL,
                'content.thumbnailUrl': downloadURL // Usando a mesma URL por simplicidade
            });
        }
        
        toast({ title: 'Sucesso!', description: 'Sua publicação foi compartilhada.' });
        handleClose();

    } catch (error) {
        console.error('Error creating post:', error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível compartilhar sua publicação.' });
    } finally {
        setIsUploading(false);
    }
  };

  const currentBgClass = backgroundStyles.find(bg => bg.id === backgroundStyle)?.class || 'bg-background';
  const currentBgId = backgroundStyles.find(bg => bg.id === backgroundStyle)?.id || '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Criar Publicação</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 space-y-4">
            <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                    <AvatarFallback>{user.displayName?.[0].toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-sm">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">Publicando na comunidade</p>
                </div>
            </div>

            <Textarea
              placeholder={postType === 'BACKGROUND_TEXT' ? 'Escreva algo impactante...' : 'No que você está pensando?'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={cn(
                  "min-h-[100px] resize-none text-base border-none focus-visible:ring-0 !p-0 shadow-none",
                  postType === 'BACKGROUND_TEXT' && `min-h-[180px] text-center text-2xl font-bold flex items-center justify-center p-4 rounded-lg text-white ${currentBgClass}`
              )}
            />

            {mediaPreview && (
                <div className="relative rounded-lg overflow-hidden border">
                    <Image
                      src={mediaPreview}
                      alt="Pré-visualização da mídia"
                      width={500}
                      height={300}
                      className="w-full h-auto object-cover"
                      data-ai-hint="user uploaded image"
                    />
                    <Button 
                        variant="destructive" size="icon" 
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={handleSelectText}>
                        <X className="h-4 w-4"/>
                    </Button>
                </div>
            )}
        </div>

        <div className="p-4 border-y">
            <div className="flex items-center gap-2">
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                 <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="h-5 w-5 text-green-500" />
                 </Button>
                 <Button variant="ghost" size="icon" onClick={() => handleSelectBg(currentBgId ? '' : 'gradient_blue')}>
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
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button onClick={handleSubmit} disabled={isUploading} className="w-full">
            {isUploading ? <Loader2 className="animate-spin" /> : 'Publicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
