"use client";

import { useState } from 'react';
import { BookOpen, Download, Copy, Check, Newspaper, Smartphone } from "lucide-react";
import { Button } from "../ui/button";
import { useToast } from "@/hooks/use-toast";
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

interface VerseImageData {
  reference: string;
  text: string;
  version: string;
  authorName?: string | null;
  orientation?: 'horizontal' | 'vertical';
}


// A função de download foi movida para DENTRO do componente
// para garantir que ela só exista no ambiente do cliente (navegador).
const downloadVerseImage = (verseData: VerseImageData): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  
  // A definição do Path2D também é movida para cá.
  const bookOpenIconPath = new Path2D("M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z");

  const orientation = verseData.orientation || 'horizontal';
  const isHorizontal = orientation === 'horizontal';

  const width = isHorizontal ? 1200 : 1080;
  const height = isHorizontal ? 630 : 1920;
  canvas.width = width;
  canvas.height = height;

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3e8ff');
  gradient.addColorStop(0.5, '#e0e7ff');
  gradient.addColorStop(1, '#f1f5f9');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const maxWidth = width - 160;
  const verseFontSize = isHorizontal ? 50 : 72;
  const verseLineHeight = isHorizontal ? 62 : 88;
  context.font = `italic ${verseFontSize}px Georgia, serif`;
  context.fillStyle = '#312e81';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  const wrapText = (text: string, x: number, y: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    const lineCount = lines.length;
    const totalTextHeight = lineCount * lineHeight;
    let startY = y - totalTextHeight / 2 + lineHeight / 2;
    if(startY - (lineHeight / 2) < 150) startY = 150;
    for (const l of lines) {
      context.fillText(l.trim(), x, startY);
      startY += lineHeight;
    }
    return startY;
  };

  const lastLineY = wrapText(`“${verseData.text}”`, width / 2, height / 2 + 40, verseLineHeight);

  const referenceFontSize = isHorizontal ? 32 : 48;
  const referenceY = (height / 2 + 40) - ((lastLineY - (height / 2 + 40)) / 2) - (isHorizontal ? 100 : 150);
  
  context.font = `bold ${referenceFontSize}px "PT Sans", sans-serif`;
  context.fillStyle = '#5a67d8';
  const referenceText = `${verseData.reference} (${verseData.version})`;
  const referenceMetrics = context.measureText(referenceText);
  const iconWidth = isHorizontal ? 28 : 42;
  const iconGap = isHorizontal ? 12 : 18;
  const totalHeaderWidth = iconWidth + iconGap + referenceMetrics.width;
  const headerStartX = (width - totalHeaderWidth) / 2;

  context.save();
  context.translate(headerStartX, referenceY - (isHorizontal ? 14 : 21));
  context.scale(isHorizontal ? 1.2 : 1.8, isHorizontal ? 1.2 : 1.8);
  context.fillStyle = '#5a67d8';
  context.fill(bookOpenIconPath);
  context.restore();

  context.textAlign = 'left';
  context.fillText(referenceText, headerStartX + iconWidth + iconGap, referenceY);

  const authorText = "Compartilhado via Verbo Vivo";
  context.font = `bold ${isHorizontal ? 20 : 28}px "PT Sans", sans-serif`;
  context.fillStyle = 'rgba(0, 0, 0, 0.25)';
  context.textAlign = 'center';
  context.fillText(authorText, width / 2, height - (isHorizontal ? 30 : 60));

  const link = document.createElement('a');
  link.download = `${verseData.reference.replace(/[:\s]/g, '_')}_${orientation}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};


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
                            <Newspaper className="mr-2 h-4 w-4" />
                            <span>Horizontal (Post)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload('vertical')}>
                            <Smartphone className="mr-2 h-4 w-4" />
                            <span>Vertical (Story)</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}