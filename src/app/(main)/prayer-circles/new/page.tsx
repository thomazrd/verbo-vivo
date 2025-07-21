
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
import { ArrowLeft, Globe, Lock, Loader2, BookUp, Users, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type SelectionMode = null | 'manual' | 'theme' | 'ai';

export default function NewPrayerCirclePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]); // To store verse references
  
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [manualVerse, setManualVerse] = useState('');


  const handleAddManualVerse = () => {
    if (manualVerse.trim()) {
      if (selectedWeapons.includes(manualVerse.trim())) {
        toast({ variant: 'default', title: 'Versículo já adicionado.' });
        return;
      }
      setSelectedWeapons(prev => [...prev, manualVerse.trim()]);
      setManualVerse('');
    }
  };
  
  const handleRemoveVerse = (verseToRemove: string) => {
    setSelectedWeapons(prev => prev.filter(v => v !== verseToRemove));
  };


  const handleSave = async () => {
    if (!user || !userProfile) {
        toast({ variant: 'destructive', title: t('toast_error'), description: t('toast_not_authenticated') });
        return;
    }
    if (!title.trim()) {
        toast({ variant: 'destructive', title: t('toast_error'), description: t('toast_title_required') });
        return;
    }
    setIsSaving(true);
    try {
      await addDoc(collection(db, "prayerCircles"), {
        name: title,
        description: description,
        isPublic: isPublic,
        authorName: userProfile.displayName || 'Anônimo',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        members: [user.uid],
        inviteCode: generateInviteCode(),
        prayingUsers: [],
        baseVerse: selectedWeapons.join('; ') || null,
      });
      toast({ title: t('toast_success'), description: t('toast_circle_created') });
      router.push('/prayer-circles');
    } catch (error) {
      console.error("Error creating circle:", error);
      toast({ variant: "destructive", title: t('toast_error'), description: t('toast_circle_create_error') });
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
          <h1 className="text-3xl font-bold tracking-tight">{t('create_circle_title')}</h1>
          <p className="text-muted-foreground">{t('create_circle_subtitle')}</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>{t('mission_title')}</CardTitle>
                <CardDescription>{t('mission_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label htmlFor="title" className="text-sm font-medium">{t('title_label')}</label>
                    <Input 
                        id="title" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder={t('title_placeholder')}
                        maxLength={80}
                    />
                     <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/80</p>
                </div>
                <div>
                    <label htmlFor="description" className="text-sm font-medium">{t('description_label')}</label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder={t('description_placeholder')}
                        className="min-h-[120px]"
                    />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Ancorando sua Oração na Palavra</CardTitle>
                <CardDescription>Adicione versículos para fundamentar o propósito desta sala.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant={selectionMode === 'manual' ? 'secondary' : 'outline'} className="h-auto py-3 flex-col gap-2" onClick={() => setSelectionMode('manual')}>
                        <Search className="h-6 w-6"/>
                        <span className="font-semibold">Buscar Manualmente</span>
                    </Button>
                    <Button variant={selectionMode === 'theme' ? 'secondary' : 'outline'} className="h-auto py-3 flex-col gap-2" onClick={() => setSelectionMode('theme')}>
                        <Users className="h-6 w-6"/>
                        <span className="font-semibold">Explorar por Tema</span>
                    </Button>
                     <Button variant={selectionMode === 'ai' ? 'secondary' : 'outline'} className="h-auto py-3 flex-col gap-2" onClick={() => setSelectionMode('ai')}>
                        <Sparkles className="h-6 w-6"/>
                        <span className="font-semibold">Sugestão com IA</span>
                    </Button>
                </div>

                {selectionMode === 'manual' && (
                    <div className="pt-4 border-t">
                        <div className="flex gap-2">
                           <Input 
                             value={manualVerse}
                             onChange={(e) => setManualVerse(e.target.value)}
                             placeholder="Digite livro, capítulo e versículo (ex: Fp 4:13)"
                           />
                           <Button onClick={handleAddManualVerse}>Adicionar</Button>
                        </div>
                    </div>
                )}
                
                {selectedWeapons.length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-2">Versículos Selecionados ({selectedWeapons.length}):</h4>
                        <div className="flex flex-wrap gap-2">
                            {selectedWeapons.map(verse => (
                                <div key={verse} className="flex items-center gap-1 bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-mono">
                                    <span>{verse}</span>
                                    <button onClick={() => handleRemoveVerse(verse)} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-3 w-3"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>{t('privacy_title')}</CardTitle>
                <CardDescription>{t('privacy_desc')}</CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant={!isPublic ? 'secondary' : 'outline'} className="h-auto p-4 flex flex-col items-start text-left" onClick={() => setIsPublic(false)}>
                   <div className="flex items-center gap-2 mb-2">
                     <Lock className="h-5 w-5"/>
                     <span className="font-bold text-base">{t('private_button')}</span>
                   </div>
                   <p className="text-xs text-muted-foreground font-normal whitespace-normal">{t('private_desc')}</p>
                </Button>
                 <Button variant={isPublic ? 'secondary' : 'outline'} className="h-auto p-4 flex flex-col items-start text-left" onClick={() => setIsPublic(true)}>
                   <div className="flex items-center gap-2 mb-2">
                     <Globe className="h-5 w-5"/>
                     <span className="font-bold text-base">{t('public_button')}</span>
                   </div>
                   <p className="text-xs text-muted-foreground font-normal whitespace-normal">{t('public_desc')}</p>
                </Button>
            </CardContent>
        </Card>

        <div className="flex justify-end">
            <Button size="lg" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('create_circle_button')}
            </Button>
        </div>
      </div>
    </div>
  );
}
