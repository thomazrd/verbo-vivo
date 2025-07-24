
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/hooks/use-auth";
import type { Study } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, UploadCloud, X, Save, Send } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { MarkdownEditor } from "./MarkdownEditor";
import { PrayerOfSower } from "./PrayerOfSower";
import { CelebrationOverlay } from "./CelebrationOverlay";

const studyFormSchema = z.object({
  title: z.string().min(5, { message: "O título deve ter pelo menos 5 caracteres." }),
  audioUrl: z.string().url({ message: "Por favor, insira uma URL válida." }),
  content: z.string().min(50, { message: "O estudo deve ter pelo menos 50 caracteres." }),
  practicalChallenge: z.string().optional(),
});

type StudyFormValues = z.infer<typeof studyFormSchema>;
type SubmitAction = 'DRAFT' | 'PUBLISHED';

export function StudyEditor({ studyId }: { studyId?: string }) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(!!studyId);
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitActionRef = useRef<SubmitAction>('DRAFT');

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: { title: "", audioUrl: "", content: "", practicalChallenge: "" },
  });

  useEffect(() => {
    if (studyId && user) {
      const fetchStudy = async () => {
        setIsLoading(true);
        const docRef = doc(db, "studies", studyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Study;
          if (data.authorId !== user.uid) {
            toast({ variant: "destructive", title: "Acesso Negado", description: "Você não tem permissão para editar este estudo." });
            router.push("/admin");
            return;
          }
          setStudy(data);
          form.reset({ title: data.title, content: data.content, audioUrl: data.audioUrl, practicalChallenge: data.practicalChallenge });
          setThumbnailPreview(data.thumbnailUrl);
        } else {
          toast({ variant: "destructive", title: "Erro", description: "Estudo não encontrado." });
          router.push("/admin/studies");
        }
        setIsLoading(false);
      };
      fetchStudy();
    }
  }, [studyId, user, form, router, toast]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFormSubmit = async (values: StudyFormValues) => {
    const status = submitActionRef.current;
    if (!user || !userProfile) return;
    setIsSaving(true);
    let newThumbnailUrl = study?.thumbnailUrl || thumbnailPreview || null;

    try {
      const docId = studyId || study?.id || doc(collection(db, "studies")).id;

      if (thumbnailFile) {
        const storagePath = `studies/${docId}/${thumbnailFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, thumbnailFile);
        newThumbnailUrl = await getDownloadURL(storageRef);
      }

      const dataToSave = {
        title: values.title,
        content: values.content,
        audioUrl: values.audioUrl,
        thumbnailUrl: newThumbnailUrl,
        practicalChallenge: values.practicalChallenge || null,
        authorId: user.uid,
        authorName: userProfile.displayName,
        updatedAt: serverTimestamp(),
        status,
        tags: [], // Placeholder for tags feature
      };

      if (studyId) {
        await updateDoc(doc(db, "studies", studyId), {
            ...dataToSave,
            publishedAt: study?.status !== 'PUBLISHED' && status === 'PUBLISHED' ? serverTimestamp() : study?.publishedAt || null,
        });
      } else {
        const newDocRef = doc(collection(db, "studies"));
        await setDoc(newDocRef, {
            ...dataToSave,
            createdAt: serverTimestamp(),
            publishedAt: status === 'PUBLISHED' ? serverTimestamp() : null,
        });
      }
      
      toast({ title: "Sucesso!", description: `Estudo salvo como ${status === 'DRAFT' ? 'rascunho' : 'publicado'}.` });

      if (status === 'PUBLISHED') {
        setShowCelebration(true);
      } else {
        router.push('/admin/studies');
      }

    } catch (error) {
      console.error("Error saving study:", error);
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Não foi possível salvar o estudo." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const onCelebrationEnd = () => {
      setShowCelebration(false);
      router.push('/admin/studies');
  }

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
    <AnimatePresence>
        {showCelebration && <CelebrationOverlay onComplete={onCelebrationEnd} />}
    </AnimatePresence>
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => router.push('/admin/studies')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{studyId ? 'Editar Estudo' : 'Criar Novo Estudo'}</h1>
        </div>
      </div>
      
      <div className="mb-6"><PrayerOfSower /></div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Título do Estudo</FormLabel>
                    <FormControl>
                      <Input placeholder="Um título claro e convidativo" {...field} className="text-lg h-12" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Conteúdo Principal</FormLabel>
                    <FormControl>
                        <MarkdownEditor
                            value={field.value}
                            onChange={field.onChange}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
            </div>

            <div className="md:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publicação</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <Button type="submit" onClick={() => submitActionRef.current = 'DRAFT'} variant="secondary" disabled={isSaving}>
                    <Save className="mr-2" /> {isSaving ? 'Salvando...' : 'Salvar Rascunho'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" disabled={isSaving}>
                        <Send className="mr-2" /> Publicar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Pronto para publicar?</AlertDialogTitle>
                        <AlertDialogDescription>
                          O estudo ficará visível para todos os usuários. Deseja continuar?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button type="submit" onClick={() => submitActionRef.current = 'PUBLISHED'}>
                          Publicar Agora
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Estudo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="audioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Áudio (Podbean)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://seu.podbean.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <FormLabel>Imagem de Capa</FormLabel>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    {thumbnailPreview ? (
                      <div className="relative mt-2">
                        <Image src={thumbnailPreview} alt="Preview" width={400} height={200} className="rounded-md w-full aspect-video object-cover" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removeThumbnail}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md hover:border-primary transition-colors">
                        <UploadCloud className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground mt-2">Clique para enviar</span>
                      </button>
                    )}
                  </div>
                   <FormField
                    control={form.control}
                    name="practicalChallenge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aplicação Prática (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Sugira uma ação ou pergunta para reflexão." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
    </>
  );
}
