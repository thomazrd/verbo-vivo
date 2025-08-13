
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
import { ArrowLeft, Globe, Lock, Loader2, BookUp, Users, Search, Sparkles, X, Plus, BookOpen, Heart, Shield, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { getPrayerCircleSuggestions } from '@/ai/flows/prayer-circle-suggestion-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

type SelectionMode = null | 'manual' | 'theme' | 'ai';

const prayerThemes = {
    "Força": { icon: Shield, verses: ["Isaías 41:10", "Filipenses 4:13", "Salmos 28:7", "Efésios 6:10", "2 Coríntios 12:9"] },
    "Paz": { icon: Heart, verses: ["João 14:27", "Filipenses 4:6-7", "Isaías 26:3", "Colossenses 3:15", "Salmos 4:8"] },
    "Cura": { icon: Sun, verses: ["Jeremias 17:14", "Tiago 5:15", "Isaías 53:5", "Salmos 103:2-3", "Êxodo 15:26"] }
};

type PrayerTheme = keyof typeof prayerThemes;

export default function NewPrayerCirclePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [manualVerse, setManualVerse] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ verse: string, text: string, justification: string }[]>([]);

  const handleAddVerse = (verseToAdd: string) => {
    if (verseToAdd.trim()) {
      if (selectedWeapons.includes(verseToAdd.trim())) {
        toast({ variant: 'default', title: 'Versículo já adicionado.' });
        return;
      }
      setSelectedWeapons(prev => [...prev, verseToAdd.trim()]);
      toast({ title: 'Versículo adicionado!', description: `${verseToAdd} foi adicionado à sua sala.`});
    }
  };
  
  const handleRemoveVerse = (verseToRemove: string) => {
    setSelectedWeapons(prev => prev.filter(v => v !== verseToRemove));
  };
  
  const handleAiSuggest = async () => {
    if (!title.trim() && !description.trim()) {
        toast({ variant: 'destructive', title: 'Contexto necessário', description: 'Por favor, preencha o título ou a descrição para receber sugestões.' });
        return;
    }
    setIsAiLoading(true);
    setAiSuggestions([]);
    try {
        const result = await getPrayerCircleSuggestions({
            title,
            description,
            model: userProfile?.preferredModel,
            language: userProfile?.preferredLanguage || i18n.language,
        });
        setAiSuggestions(result.suggestions);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Erro de IA', description: 'Não foi possível buscar sugestões.' });
    } finally {
        setIsAiLoading(false);
    }
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
                 {selectedWeapons.length > 0 && (
                    <div className="pt-2">
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
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" /> Adicionar Versículos da Palavra
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] flex flex-col sm:max-w-2xl">
                         <DialogHeader>
                            <DialogTitle>Adicionar Versículos</DialogTitle>
                            <DialogDescription>Selecione versículos para fundamentar esta sala de oração.</DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="ai" className="flex-1 flex flex-col min-h-0">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="ai"><Sparkles className="h-4 w-4 mr-2" />Sugestão</TabsTrigger>
                                <TabsTrigger value="theme"><BookOpen className="h-4 w-4 mr-2" />Por Tema</TabsTrigger>
                                <TabsTrigger value="manual"><Search className="h-4 w-4 mr-2" />Manual</TabsTrigger>
                            </TabsList>
                            <TabsContent value="ai" className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
                                <div className="space-y-4">
                                     <p className="text-sm text-muted-foreground">Descreva o motivo da oração no campo de título ou descrição da sala e clique no botão para a IA sugerir versículos relevantes.</p>
                                     <Button onClick={handleAiSuggest} disabled={isAiLoading}> {isAiLoading ? <Loader2 className="animate-spin mr-2"/> : <Wand2 className="mr-2"/>} Gerar Sugestões </Button>
                                     {isAiLoading ? (
                                        <div className="text-center py-6 flex flex-col items-center gap-2 text-muted-foreground">
                                            <Loader2 className="h-6 w-6 animate-spin"/>
                                            <p>Analisando seu pedido à luz da Palavra...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {aiSuggestions.length === 0 && !isAiLoading && <p className="text-center text-sm text-muted-foreground py-4">Nenhuma sugestão encontrada. Tente descrever melhor o motivo.</p>}
                                            {aiSuggestions.map(suggestion => {
                                                const isAdded = selectedWeapons.includes(suggestion.verse);
                                                return (
                                                    <Card key={suggestion.verse} className="p-4">
                                                        <p className="font-bold text-primary">{suggestion.verse}</p>
                                                        <blockquote className="text-muted-foreground italic mt-1">"{suggestion.text}"</blockquote>
                                                        <p className="text-xs mt-2"><strong className="text-primary/80">Por que esta Palavra?</strong> {suggestion.justification}</p>
                                                        <div className="text-right mt-2">
                                                            <Button 
                                                                size="sm"
                                                                variant={isAdded ? "destructive" : "default"}
                                                                onClick={() => isAdded ? handleRemoveVerse(suggestion.verse) : handleAddVerse(suggestion.verse)}
                                                            >
                                                                {isAdded ? <X className="h-4 w-4 mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                                                                {isAdded ? 'Remover' : 'Adicionar à Sala'}
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="theme" className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
                                <div className="space-y-4">
                                    {Object.keys(prayerThemes).map(theme => {
                                        const ThemeIcon = prayerThemes[theme as PrayerTheme].icon;
                                        return (
                                            <div key={theme}>
                                                <h4 className="font-semibold text-md mb-2 flex items-center gap-2"><ThemeIcon className="h-4 w-4"/> {theme}</h4>
                                                <div className="space-y-2">
                                                    {prayerThemes[theme as PrayerTheme].verses.map(verse => (
                                                        <div key={verse} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                                            <p className="text-sm font-mono">{verse}</p>
                                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleAddVerse(verse)}><Plus className="h-4 w-4"/></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                            <TabsContent value="manual" className="flex-1 overflow-y-auto mt-4 -mx-6 px-6">
                                <div className="space-y-3">
                                    <p className="text-sm text-muted-foreground">Digite a referência bíblica que deseja adicionar.</p>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={manualVerse}
                                            onChange={(e) => setManualVerse(e.target.value)}
                                            placeholder="Ex: Fp 4:13"
                                        />
                                        <Button onClick={() => { handleAddVerse(manualVerse); setManualVerse(''); }}>Adicionar</Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                        <DialogFooter className="mt-4 pt-4 border-t">
                          <DialogTrigger asChild><Button variant="outline">Fechar</Button></DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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

