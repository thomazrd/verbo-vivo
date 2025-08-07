
"use client";

import { useState } from 'react';
import { BookOpen, Download, Copy, Check, AspectRatio, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadVerseImage } from "@/lib/download-verse-image";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';


interface VerseCardProps {
  reference: string;
  text: string;
  version?: string;
  authorName?: string | null;
}

export function VerseCard({ reference, text, version, authorName }: VerseCardProps) {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = `"${text}" - ${reference} (${version || 'Bíblia'})`;
        navigator.clipboard.writeText(textToCopy);
        setHasCopied(true);
        toast({ title: 'Copiado!', description: 'O versículo foi copiado para a área de transferência.' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleDownload = (orientation: 'horizontal' | 'vertical') => {
        downloadVerseImage({
            reference,
            text,
            version: version || 'NVI',
            authorName: "Verbo Vivo", // Standardized as requested
            orientation: orientation,
        });
    };

    return (
        <div className="border bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm text-primary">{reference}</h4>
                {version && <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm">{version}</span>}
            </div>
            <blockquote className="border-l-2 border-primary/50 pl-3 italic text-card-foreground/90 text-sm leading-relaxed">
                “{text}”
            </blockquote>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleCopy}>
                    {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                            <Download className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                         <DropdownMenuItem onClick={() => handleDownload('horizontal')}>
                            <AspectRatio className="mr-2 h-4 w-4" />
                            <span>Horizontal (Post)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('vertical')}>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            <span>Vertical (Story)</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
