"use client"

import * as React from "react"

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
import { auth } from "@/lib/firebase"
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
import { LanguageSelector } from "@/components/settings/LanguageSelector" // Added import
import { useTranslation } from "react-i18next" // Added import for t function

import { doc, updateDoc } from "firebase/firestore"; // Added imports
import { db } from "@/lib/firebase"; // db was already in auth, but good to be explicit if needed elsewhere

export default function SettingsPage() {
  const { t } = useTranslation(); // Added for card titles/descriptions
  const { user, loading } = useAuth(); // Added loading state from useAuth
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut(auth) // auth is already imported from @/lib/firebase
    router.push("/login")
  }

  const handleSaveLanguagePreference = async (newLangCode: string) => {
    if (!user) {
      toast({ title: t('error_saving_language_title') || "Erro", description: t('user_not_logged_in_error') || "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, {
        preferredLanguage: newLangCode,
      });
      toast({ title: t('language_saved_success_title') || "Preferência Salva", description: t('language_preference_saved_desc') || `Idioma preferido salvo como ${newLangCode}.` });
    } catch (error) {
      console.error("Error updating language preference:", error);
      toast({ title: t('error_saving_language_title') || "Erro ao Salvar", description: t('error_saving_language_desc') || "Não foi possível salvar a preferência de idioma.", variant: "destructive" });
      // Re-throw to allow LanguageSelector to handle its state if needed
      throw error;
    }
  };

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
            <CardTitle>{t('profile_settings_title') || 'Perfil'}</CardTitle>
            <CardDescription>
              {t('profile_settings_description') || 'Informações da sua conta.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>{t('email_label') || 'Email'}</Label>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('language_settings_title') || 'Idioma'}</CardTitle>
            <CardDescription>
              {t('language_settings_card_description') || 'Escolha o idioma de preferência para a interface.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector onLanguageSave={handleSaveLanguagePreference} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('account_settings_title') || 'Conta'}</CardTitle>
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
