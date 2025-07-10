
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, Share2 } from "lucide-react";
import type { SharedContent } from "@/lib/types";

interface ContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: SharedContent;
  contentId: string;
}

export function ContentPreviewModal({ isOpen, onClose, content, contentId }: ContentPreviewModalProps) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  
  // Ensure we are in a browser environment before accessing window.location
  const shareableLink = typeof window !== 'undefined'
    ? `${window.location.origin}/ponte/${contentId}`
    : '';

  const handleCopy = () => {
    if (!shareableLink) return;
    navigator.clipboard.writeText(shareableLink);
    setHasCopied(true);
    toast({
      title: 'Link Copiado!',
      description: 'O link está pronto para ser compartilhado.',
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && shareableLink) {
      try {
        await navigator.share({
          title: content.title,
          text: content.opening,
          url: shareableLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      handleCopy();
    }
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pré-visualização e Compartilhamento</DialogTitle>
          <DialogDescription>
            Este é o conteúdo que será compartilhado. Se estiver tudo certo, copie o link e envie para a pessoa.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 max-h-[50vh] overflow-y-auto rounded-md border p-4 space-y-4 prose prose-sm max-w-none">
            <h2>{content.title}</h2>
            <p className="lead">{content.opening}</p>
            {content.sections.map((section, index) => (
                <div key={index}>
                    <blockquote className="border-l-4 pl-4 italic">
                        <p>“{section.verse_text}”</p>
                        <footer>— {section.verse}</footer>
                    </blockquote>
                    <p>{section.explanation}</p>
                </div>
            ))}
            <p>{content.conclusion}</p>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="share-link">Link Compartilhável</Label>
            <div className="flex items-center gap-2">
                <Input id="share-link" value={shareableLink} readOnly />
                <Button onClick={handleCopy} size="icon" variant="outline">
                    {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4"/>
              Compartilhar Agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
