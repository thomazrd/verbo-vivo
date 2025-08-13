
"use client"

import * as React from "react"
import { useTranslation } from "react-i18next";
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from "next/image";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "firebase/auth"
import { auth, db, storage } from "@/lib/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, BrainCircuit, BookMarked } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { BibleVersion } from "@/lib/types";
import axios from "axios";

const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文 (Chinês)' },
    { code: 'ja', name: '日本語 (Japonês)' },
    { code: 'ar', name: 'العربية (Árabe)' },
];

const aiModels = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Rápido)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Avançado)' },
];

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function SettingsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { i18n, t } = useTranslation();

  const [isSavingLanguage, setIsSavingLanguage] = React.useState(false);
  const [isSavingModel, setIsSavingModel] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  const [newAvatarFile, setNewAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [bibleVersions, setBibleVersions] = React.useState<BibleVersion[]>([]);
  const [isBibleVersionLoading, setIsBibleVersionLoading] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });
  
  const currentLanguage = i18n.language.split('-')[0];
  const preferredBibleVersion = userProfile?.preferredBibleVersion;

  React.useEffect(() => {
    if (userProfile) {
      form.setValue("displayName", userProfile.displayName || "");
    }
  }, [userProfile, form]);
  
  React.useEffect(() => {
    if (newAvatarFile) {
        const objectUrl = URL.createObjectURL(newAvatarFile);
        setAvatarPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }
  }, [newAvatarFile]);

  React.useEffect(() => {
    const fetchVersions = async () => {
      setIsBibleVersionLoading(true);
      try {
        const response = await axios.get(`/api/bible/versions?lang=${currentLanguage}`);
        setBibleVersions(response.data);
      } catch (error) {
        console.error("Failed to fetch bible versions", error);
      } finally {
        setIsBibleVersionLoading(false);
      }
    };
    fetchVersions();
  }, [currentLanguage]);


  const handleLanguageChange = async (newLang: string) => {
    if (!user) return;
    setIsSavingLanguage(true);
    try {
        await i18n.changeLanguage(newLang);
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { preferredLanguage: newLang, preferredBibleVersion: null }); // Reset bible version on lang change
        toast({
            title: t('toast_language_updated_title'),
            description: t('toast_language_updated_desc', { lang: languages.find(l => l.code === newLang)?.name }),
        });
    } catch (error) {
        console.error("Error changing language:", error);
        toast({
            variant: "destructive",
            title: t('toast_error'),
            description: t('toast_language_error'),
        });
    } finally {
        setIsSavingLanguage(false);
    }
  };
  
  const handlePreferenceChange = async (key: 'preferredModel' | 'preferredBibleVersion', value: any) => {
    if (!user) return;
    
    const isModel = key === 'preferredModel';
    if(isModel) setIsSavingModel(true);
    else setIsSavingLanguage(true); // Share loader for language/version

    try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { [key]: value });
        
        let toastDesc = isModel
          ? t('toast_model_updated_desc', { model: aiModels.find(m => m.id === value)?.name })
          : t('toast_bible_version_updated_desc', { version: value.name });

        toast({
            title: t('toast_preference_updated_title'),
            description: toastDesc,
        });
    } catch (error) {
        console.error(`Error changing ${key}:`, error);
        toast({
            variant: "destructive",
            title: t('toast_error'),
            description: t('toast_preference_error_desc'),
        });
    } finally {
        if(isModel) setIsSavingModel(false);
        else setIsSavingLanguage(false);
    }
  };

  const onProfileSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!user) return;
    setIsSavingProfile(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      let newPhotoURL = userProfile?.photoURL || null;

      if (newAvatarFile) {
        const filePath = `avatars/${user.uid}/${newAvatarFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, newAvatarFile);
        newPhotoURL = await getDownloadURL(storageRef);
      }

      const hasDisplayNameChanged = data.displayName !== userProfile?.displayName;
      
      const updateData: { displayName?: string, photoURL?: string | null } = {};
      if(hasDisplayNameChanged) updateData.displayName = data.displayName;
      if(newPhotoURL !== userProfile?.photoURL) updateData.photoURL = newPhotoURL;

      if(Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        // Also update member doc if in a congregation
        if (userProfile?.congregationId) {
            const memberDocRef = doc(db, 'congregations', userProfile.congregationId, 'members', user.uid);
            const memberDocSnap = await getDoc(memberDocRef);
            if (memberDocSnap.exists()) {
                await updateDoc(memberDocRef, updateData);
            }
        }

        toast({ title: t('toast_profile_updated_title') });
      }

      setNewAvatarFile(null);
      setAvatarPreview(null);

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: 'destructive',
        title: t('toast_profile_error_title'),
        description: t('toast_profile_error_desc'),
      });
    } finally {
      setIsSavingProfile(false);
    }
  };


  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    toast({
      title: t('toast_account_deleted_title'),
      description: t('toast_account_deleted_desc'),
    })
    router.push("/login")
  }


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight">{t('settings_title')}</h1>
      <p className="mt-1 text-muted-foreground">
        {t('settings_subtitle')}
      </p>

      <div className="mt-8 space-y-6">
        <Card>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                    <CardTitle>{t('profile_title')}</CardTitle>
                    <CardDescription>
                    {t('profile_subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="h-20 w-20 border-2">
                                <AvatarImage src={avatarPreview || userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'Avatar'} />
                                <AvatarFallback className="text-2xl">
                                    {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/png, image/jpeg, image/gif"
                                onChange={(e) => e.target.files && setNewAvatarFile(e.target.files[0])}
                            />
                            <Button 
                                type="button" 
                                size="icon" 
                                className="absolute -bottom-1 -right-1 rounded-full h-8 w-8"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1">
                            <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('display_name_label')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('display_name_placeholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                    </div>
                     <div className="flex items-center justify-between">
                        <Label>{t('email_label')}</Label>
                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('save_changes_button')}
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{t('preferences_title')}</CardTitle>
            <CardDescription>
              {t('preferences_subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <Label htmlFor="credits-display" className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    Créditos de IA
                </Label>
                <span className="font-semibold text-primary">{userProfile?.aiCredits ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="language-select">{t('language_label')}</Label>
                <div className="flex items-center gap-2">
                    {isSavingLanguage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select
                        value={currentLanguage}
                        onValueChange={handleLanguageChange}
                        disabled={isSavingLanguage}
                    >
                        <SelectTrigger id="language-select" className="w-[200px]">
                            <SelectValue placeholder={t('select_language_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map((lang) => (
                                <SelectItem key={lang.code} value={lang.code}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="bible-version-select" className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4" />
                    {t('bible_version_label')}
                </Label>
                <div className="flex items-center gap-2">
                    {isSavingLanguage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select
                        value={preferredBibleVersion?.id}
                        onValueChange={(val) => handlePreferenceChange('preferredBibleVersion', bibleVersions.find(v => v.id === val))}
                        disabled={isSavingLanguage || isBibleVersionLoading || bibleVersions.length === 0}
                    >
                        <SelectTrigger id="bible-version-select" className="w-[240px]">
                            <SelectValue placeholder={t('select_bible_version_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {isBibleVersionLoading ? (
                                <div className="p-2">Carregando...</div>
                            ) : (
                                bibleVersions.map((v) => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="flex items-center justify-between">
                <Label htmlFor="model-select" className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4" />
                    {t('ai_model_label')}
                </Label>
                <div className="flex items-center gap-2">
                    {isSavingModel && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select
                        value={userProfile?.preferredModel || 'gemini-1.5-flash'}
                        onValueChange={(val) => handlePreferenceChange('preferredModel', val)}
                        disabled={isSavingModel}
                    >
                        <SelectTrigger id="model-select" className="w-[240px]">
                            <SelectValue placeholder={t('select_model_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {aiModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                    {model.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('account_title')}</CardTitle>
            <CardDescription>
              {t('account_subtitle')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleSignOut}>
              {t('sign_out_button')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{t('delete_account_button')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('delete_account_confirm_title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('delete_account_confirm_desc')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel_button')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    {t('continue_button')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
