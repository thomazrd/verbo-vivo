
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
import { Loader2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文 (Chinês)' },
    { code: 'ja', name: '日本語 (Japonês)' },
];

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }).max(50, { message: "O nome não pode ter mais de 50 caracteres." }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function SettingsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language);
  const [isSavingLanguage, setIsSavingLanguage] = React.useState(false);
  
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [newAvatarFile, setNewAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      form.setValue("displayName", userProfile.displayName || "");
    }
  }, [userProfile, form]);
  
  React.useEffect(() => {
    if (newAvatarFile) {
        setAvatarPreview(URL.createObjectURL(newAvatarFile));
    }
    return () => {
        if(avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }
    }
  }, [newAvatarFile, avatarPreview]);


  const handleLanguageChange = async (newLang: string) => {
    if (!user) return;
    setIsSavingLanguage(true);
    setSelectedLanguage(newLang);
    try {
        await i18n.changeLanguage(newLang);
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { preferredLanguage: newLang });
        toast({
            title: "Idioma atualizado!",
            description: `O idioma foi alterado para ${languages.find(l => l.code === newLang)?.name}.`,
        });
    } catch (error) {
        console.error("Error changing language:", error);
        toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível alterar o idioma.",
        });
    } finally {
        setIsSavingLanguage(false);
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

        toast({ title: "Perfil atualizado com sucesso!" });
      }

      setNewAvatarFile(null);
      if(avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível salvar suas alterações. Tente novamente.',
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
      title: "Conta excluída (simulação)",
      description: "Sua conta e dados foram removidos com sucesso.",
    })
    router.push("/login")
  }


  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="mt-1 text-muted-foreground">
        Gerencie suas preferências e sua conta.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onProfileSubmit)}>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>
                    Atualize seu nome e foto de perfil.
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
                                <FormLabel>Nome de Exibição</FormLabel>
                                <FormControl>
                                    <Input placeholder="Seu nome" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                    </div>
                     <div className="flex items-center justify-between">
                        <Label>Email</Label>
                        <span className="text-sm text-muted-foreground">{user?.email}</span>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                    </Button>
                </CardFooter>
            </form>
            </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idioma</CardTitle>
            <CardDescription>
              Escolha o idioma de sua preferência para a interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
                <Label htmlFor="language-select">Idioma</Label>
                <div className="flex items-center gap-2">
                    {isSavingLanguage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Select
                        value={selectedLanguage}
                        onValueChange={handleLanguageChange}
                        disabled={isSavingLanguage}
                    >
                        <SelectTrigger id="language-select" className="w-[200px]">
                            <SelectValue placeholder="Selecione o idioma" />
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>
              Gerenciamento da sua conta.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Deletar Conta</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente
                    sua conta e removerá seus dados de nossos servidores.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount}>
                    Continuar
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
