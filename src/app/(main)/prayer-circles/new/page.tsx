
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
import { useTranslation } from 'react-i18next';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function NewPrayerCirclePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [baseVerse, setBaseVerse] = useState('');

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
        baseVerse: baseVerse,
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
                <CardTitle>{t('ammunition_title')}</CardTitle>
                <CardDescription>{t('ammunition_desc')}</CardDescription>
            </CardHeader>
             <CardContent>
                <label htmlFor="baseVerse" className="text-sm font-medium">{t('base_verse_label')}</label>
                <Input 
                    id="baseVerse" 
                    value={baseVerse} 
                    onChange={e => setBaseVerse(e.target.value)} 
                    placeholder={t('base_verse_placeholder')}
                />
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
