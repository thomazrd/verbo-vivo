
"use client"

import * as React from "react"
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { signOut } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore";
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
import { Loader2 } from "lucide-react";

const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文 (Chinês)' },
    { code: 'ja', name: '日本語 (Japonês)' },
];

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language);
  const [isSavingLanguage, setIsSavingLanguage] = React.useState(false);


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


  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    // This is a placeholder for the actual account deletion logic.
    // In a real app, this would involve a call to a backend function
    // to delete user data from Firestore and Auth.
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
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>
              Informações da sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Email</Label>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </CardContent>
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
