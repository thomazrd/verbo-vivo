
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuoteGeneratorPage() {
  const [quote, setQuote] = useState("A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.");
  const [author, setAuthor] = useState("Hebreus 11:1");

  const handleDownload = (orientation: 'horizontal' | 'vertical') => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    const isHorizontal = orientation === 'horizontal';
    const width = isHorizontal ? 1200 : 1080;
    const height = isHorizontal ? 630 : 1920;
    canvas.width = width;
    canvas.height = height;

    // Fundo
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a8a'); // blue-900
    gradient.addColorStop(1, '#312e81'); // indigo-900
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    
    // Frase
    const maxWidth = width - 160;
    const quoteFontSize = isHorizontal ? 60 : 80;
    const quoteLineHeight = isHorizontal ? 75 : 95;
    context.font = `italic bold ${quoteFontSize}px Georgia, serif`;
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Função para quebrar linha
    const wrapText = (text: string, x: number, y: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines = [];
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        const totalTextHeight = lines.length * lineHeight;
        let startY = y - totalTextHeight / 2;
        
        for (const l of lines) {
            context.fillText(l.trim(), x, startY);
            startY += lineHeight;
        }
    };

    wrapText(`“${quote}”`, width / 2, height / 2);
    
    // Autor
    const authorFontSize = isHorizontal ? 32 : 48;
    context.font = `${authorFontSize}px "Helvetica Neue", sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.7)';
    context.textAlign = 'center';
    const authorY = height / 2 + 100 + (isHorizontal ? 50 : 150);
    context.fillText(`— ${author}`, width / 2, authorY);
    
    // Logo
    context.font = `bold ${isHorizontal ? 20 : 28}px "Helvetica Neue", sans-serif`;
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.fillText("Gerado por Verbo Vivo", width / 2, height - (isHorizontal ? 30 : 60));

    // Download
    const link = document.createElement('a');
    link.download = `frase_verbo_vivo_${orientation}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Edit className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Gerador de Frases</h1>
        <p className="mt-2 text-muted-foreground">
          Crie imagens inspiradoras com suas frases favoritas para compartilhar.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Insira a frase e o autor para gerar a imagem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quote-input">Frase</Label>
              <Textarea
                id="quote-input"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="A sua frase inspiradora..."
                className="min-h-[150px] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author-input">Autor</Label>
              <Input
                id="author-input"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Quem disse isso?"
                className="text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button onClick={() => handleDownload('horizontal')} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Baixar para Post (16:9)
              </Button>
              <Button onClick={() => handleDownload('vertical')} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Baixar para Story (9:16)
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Pré-visualização</h3>
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-8 text-white shadow-lg">
                <div className="text-center">
                    <p className="font-serif italic text-2xl md:text-3xl">“{quote}”</p>
                    <p className="mt-4 text-white/70 text-lg">— {author}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
