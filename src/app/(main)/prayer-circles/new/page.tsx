
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Lock, Loader2, BookUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function NewPrayerCirclePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !userProfile) {
        toast({ variant: 'destructive', title: 'Não autenticado.' });
        return;
    }
    if (!title.trim()) {
        toast({ variant: 'destructive', title: 'Título é obrigatório.' });
        return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "prayerCircles"), {
        name: title,
        description: description,
        isPublic: isPublic,
        createdBy: user.uid,
        authorName: userProfile.displayName || 'Anônimo',
        createdAt: serverTimestamp(),
        members: [user.uid],
        inviteCode: generateInviteCode(),
      });
      toast({ title: "Sucesso!", description: "Seu novo círculo de oração foi criado." });
      router.push('/prayer-circles');
    } catch (error) {
      console.error("Error creating circle:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar o círculo." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criar Círculo de Oração</h1>
          <p className="text-muted-foreground">Peça reforços para sua batalha.</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Missão</CardTitle>
                <CardDescription>Defina o propósito do seu círculo de oração.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="title" className="text-sm font-medium">Título</label>
                    <Input 
                        id="title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Ex: Oração pela saúde da família"
                        maxLength={80}
                    />
                     <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/80</p>
                </div>
                <div>
                    <label htmlFor="description" className="text-sm font-medium">Descrição</label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Detalhe sua necessidade. Quanto mais claro o alvo, mais precisa a oração."
                        className="min-h-[120px]"
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Munição</CardTitle>
                <CardDescription>Anexe versículos que servirão como base para as orações.</CardDescription>
            </CardHeader>
             <CardContent>
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <BookUp className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-sm font-semibold text-muted-foreground">Sugestão de versículos aparecerá aqui.</p>
                    <p className="text-xs text-muted-foreground">(Funcionalidade em desenvolvimento)</p>
                </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Privacidade</CardTitle>
                <CardDescription>Escolha quem pode ver e participar deste círculo.</CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant={!isPublic ? 'secondary' : 'outline'} className="h-auto p-4 flex flex-col items-start text-left" onClick={() => setIsPublic(false)}>
                   <div className="flex items-center gap-2 mb-2">
                     <Lock className="h-5 w-5"/>
                     <span className="font-bold text-base">Privada</span>
                   </div>
                   <p className="text-xs text-muted-foreground font-normal whitespace-normal">Acessível apenas por convite direto.</p>
                </Button>
                 <Button variant={isPublic ? 'secondary' : 'outline'} className="h-auto p-4 flex flex-col items-start text-left" onClick={() => setIsPublic(true)}>
                   <div className="flex items-center gap-2 mb-2">
                     <Globe className="h-5 w-5"/>
                     <span className="font-bold text-base">Pública</span>
                   </div>
                   <p className="text-xs text-muted-foreground font-normal whitespace-normal">Visível para todo o batalhão do Verbo Vivo.</p>
                </Button>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Círculo
            </Button>
        </div>
      </div>
    </div>
  );
}
